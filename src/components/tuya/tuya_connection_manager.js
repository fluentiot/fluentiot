const logger = require('./../../commons/logger');
const TuyaApiClient = require('./tuya_api_client');
const TuyaMqttClient = require('./tuya_mqtt_client');
const { v1: uuidv1 } = require('uuid');

/**
 * States for connection lifecycle
 * @enum {string}
 */
const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

/**
 * Manages connections to Tuya API and MQTT
 */
class TuyaConnectionManager {
    constructor(settings, callbacks) {
        this.settings = settings;
        this.callbacks = callbacks;
        
        this.state = ConnectionState.DISCONNECTED;
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.pendingReconnect = false;
        
        this.apiClient = null;
        this.mqttClient = null;
        
        this.reconnectTimeout = null;
        this.healthCheckInterval = null;
    }

    /**
     * Start connections to Tuya services
     */
    async start() {
        if (this.state === ConnectionState.CONNECTING || 
            this.state === ConnectionState.RECONNECTING) {
            logger.debug('Already connecting/reconnecting, skipping start', 'tuya connection');
            return;
        }

        try {
            this._setState(ConnectionState.CONNECTING);
            
            this.apiClient = new TuyaApiClient(
                this.settings.hostname,
                this.settings.token_info.access_key,
                this.settings.token_info.secret_key,
                this.settings.token_info.username,
                this.settings.token_info.password
            );

            await this._connectApi();
            await this._initializeMqtt();

            this._setState(ConnectionState.CONNECTED);
            this.callbacks.onConnected();
            
        } catch (error) {
            this._handleError('Failed to start connection manager', error);
            throw error;
        }
    }

    /**
     * Send command to device through API
     */
    async sendCommand(command) {
        if (this.state !== ConnectionState.CONNECTED) {
            throw new Error('Cannot send command while disconnected');
        }

        try {
            await this.apiClient.post(command.options.url, this._formatCommand(command));
        } catch (error) {
            this._handleError('Failed to send command', error);
            throw error;
        }
    }

    /**
     * Stop all connections and cleanup
     */
    async stop() {
        // Don't change state if we're in the middle of reconnecting
        if (!this.isReconnecting) {
            this._setState(ConnectionState.DISCONNECTED);
        }
        
        if (this.mqttClient) {
            await this.mqttClient.stop();
            this.mqttClient = null;
        }
        
        this.apiClient = null;

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Connect to API
     * @private
     */
    async _connectApi() {
        try {
            await this.apiClient.connect();
        } catch (error) {
            this._handleError('API connection failed', error);
            throw error;
        }
    }

    /**
     * Initialize MQTT connection
     * @private
     */
    async _initializeMqtt() {
        try {
            const configBody = {
                uid: this.settings.token_info.uid,
                link_id: `tuya-iot-app-sdk-node.${uuidv1()}`,
                link_type: 'mqtt',
                topics: 'device',
                msg_encrypted_version: '1.0'
            };

            logger.debug(`Requesting MQTT config from Tuya API`, 'tuya connection');
            const response = await this.apiClient.post('/v1.0/open-hub/access/config', configBody);
            
            if (!response?.success || !response?.result) {
                logger.error(`Invalid MQTT config response: ${JSON.stringify(response)}`, 'tuya connection');
                throw new Error('Failed to get valid MQTT config');
            }

            this.mqttClient = new TuyaMqttClient(response.result, this.settings);
            
            this.mqttClient.onMessage = (data) => {
                this.callbacks.onDeviceData(data);
            };

            this.mqttClient.onDisconnect = () => {
                // Only handle disconnect if we're in a connected state
                if (this.state === ConnectionState.CONNECTED && !this.isReconnecting) {
                    this._handleDisconnect('MQTT disconnected');
                }
            };

            await this.mqttClient.start();
            logger.info('MQTT client initialized and connected', 'tuya connection');

        } catch (error) {
            this._handleError('MQTT initialization failed', error);
            throw error;
        }
    }

    /**
     * Start health check interval
     * @private
     */
    _startHealthChecks() {
        this._stopHealthChecks();
        
        this.healthCheckInterval = setInterval(async () => {
            // Skip health check if we're already reconnecting
            if (this.isReconnecting) {
                return;
            }

            try {
                // Only check API health - MQTT has its own connection monitoring
                const apiHealthy = await this.apiClient.checkHealth();
                
                // Only trigger reconnect if API is unhealthy
                if (!apiHealthy) {
                    logger.warn('API health check failed, initiating reconnection', 'tuya connection');
                    this._handleDisconnect('Health check failed');
                }
            } catch (error) {
                // Only log the error, let MQTT handle its own reconnection
                logger.error(`Health check error: ${error.message}`, 'tuya connection');
            }
        }, this.HEALTH_CHECK_INTERVAL);
    }

    /**
     * Stop health check interval
     * @private
     */
    _stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Handle connection errors
     * @private
     */
    _handleError(message, error) {
        this.lastError = error;
        this._setState(ConnectionState.ERROR);
        logger.error(`${message}: ${error.message}`, 'tuya connection');
        
        if (!this.isReconnecting) {
            this._handleDisconnect(message);
        }
    }

    /**
     * Handle disconnection with exponential backoff
     * @private
     */

    _handleDisconnect(reason) {
        // If we're already reconnecting, just mark that we need another reconnect
        if (this.isReconnecting) {
            this.pendingReconnect = true;
            logger.debug('Already reconnecting, queuing another reconnect attempt', 'tuya connection');
            return;
        }

        this.isReconnecting = true;
        this._setState(ConnectionState.RECONNECTING);
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Max reconnection attempts reached', 'tuya connection');
            this._setState(ConnectionState.ERROR);
            this.isReconnecting = false;
            return;
        }

        const delay = Math.min(
            this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
            300000
        );

        logger.info(`Attempting reconnection in ${delay}ms. Attempt ${this.reconnectAttempts}`, 'tuya connection');

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(async () => {
            try {
                await this.stop();
                await this.start();
                this.reconnectAttempts = 0;
                this.isReconnecting = false;
                
                // If another reconnect was requested while we were reconnecting
                if (this.pendingReconnect) {
                    this.pendingReconnect = false;
                    this._handleDisconnect('Pending reconnect requested');
                }
            } catch (error) {
                this._handleError('Reconnection failed', error);
                this.isReconnecting = false;
            }
        }, delay);
    }

    /**
     * Set connection state
     * @private
     */
    _setState(newState) {
        // Don't change state if we're reconnecting unless it's back to CONNECTED
        if (this.isReconnecting && newState !== ConnectionState.CONNECTED) {
            return;
        }
        
        const oldState = this.state;
        this.state = newState;
        logger.debug(`Connection state changed from ${oldState} to ${newState}`, 'tuya connection');
    }

    /**
     * Format command based on API version
     * @private
     */
    _formatCommand(command) {
        if (command.options.version === 'v2.0') {
            return { properties: command.command };
        }

        let commands = command.command;
        if (!Array.isArray(commands) && !commands.code) {
            commands = Object.keys(commands).map((code) => ({
                code,
                value: commands[code]
            }));
        }

        if (!Array.isArray(commands)) {
            commands = [commands];
        }

        return { commands };
    }
}

module.exports = TuyaConnectionManager;