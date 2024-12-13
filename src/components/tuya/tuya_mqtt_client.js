const mqtt = require('mqtt');
const crypto = require('crypto');
const logger = require('./../../logger');
const { isJSONString } = require('./../../utils/index');

/**
 * Simplified Tuya MQTT client with comprehensive logging
 */
class TuyaMqttClient {
    constructor(mqttConfig, settings) {
        this.mqttConfig = mqttConfig;
        this.settings = settings;
        
        this.client = null;
        this.connected = false;
        this.lastMessageTime = null;
        this.subscriptions = new Set();
        
        this.onMessage = null;
        this.onDisconnect = null;

        // Connection monitoring
        this.monitorInterval = null;
        this.MONITOR_INTERVAL = 30000; // Check every 30 seconds
        this.MESSAGE_TIMEOUT = 120000;  // Consider connection stale after 2 minutes without messages
    }
    
    /**
     * Start MQTT connection
     */
    async start() {
        try {
            logger.debug(`Starting MQTT client connection to: ${this.mqttConfig.url}`, 'tuya mqtt');
            logger.debug(`Client ID: ${this.mqttConfig.client_id}`, 'tuya mqtt');
            
            this.client = mqtt.connect(this.mqttConfig.url, {
                clientId: this.mqttConfig.client_id,
                username: this.mqttConfig.username,
                password: this.mqttConfig.password,
                keepalive: 30,
                reconnectPeriod: 5000,
                connectTimeout: 30000,
                clean: true,
                rejectUnauthorized: true
            });

            this._setupEventHandlers();
            this._startMonitoring();
            return true;
        } catch (error) {
            logger.error(`MQTT connection failed: ${error.message}`, 'tuya mqtt');
            throw error;
        }
    }

    /**
     * Stop MQTT connection
     */
    async stop() {
        this._stopMonitoring();
        
        if (this.client) {
            logger.debug('Stopping MQTT client', 'tuya mqtt');
            this.client.end(true);
            this.client = null;
        }
        this.connected = false;
        this.subscriptions.clear();
        this.lastMessageTime = null;
    }

    /**
     * Start connection monitoring
     * @private
     */
    _startMonitoring() {
        this._stopMonitoring();
        
        this.monitorInterval = setInterval(() => {
            if (!this.connected) {
                return;
            }

            const now = Date.now();
            if (this.lastMessageTime) {
                const timeSinceLastMessage = now - this.lastMessageTime;
                logger.debug(`Time since last message: ${timeSinceLastMessage/1000}s`, 'tuya mqtt');

                // If we haven't received any message (including keepalive) for too long
                if (timeSinceLastMessage > this.MESSAGE_TIMEOUT) {
                    logger.warn(`No messages received for ${timeSinceLastMessage/1000}s, connection may be stale`, 'tuya mqtt');
                    if (this.onDisconnect) {
                        this.onDisconnect();
                    }
                }
            }

            // Log current subscriptions
            if (this.subscriptions.size > 0) {
                logger.debug('Active subscriptions:', 'tuya mqtt');
                for (const topic of this.subscriptions) {
                    logger.debug(`  - ${topic}`, 'tuya mqtt');
                }
            }
        }, this.MONITOR_INTERVAL);
    }

    /**
     * Stop connection monitoring
     * @private
     */
    _stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        const isClientConnected = this.client?.connected || false;
        logger.debug(`MQTT connection status - Internal: ${this.connected}, Client: ${isClientConnected}`, 'tuya mqtt');
        return this.connected && isClientConnected;
    }


    /**
     * Setup MQTT event handlers
     * @private
     */
    _setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info('MQTT Connected', 'tuya mqtt');
            this.connected = true;
            this.lastMessageTime = Date.now();
            
            // Subscribe to device updates
            const deviceTopic = this.mqttConfig.source_topic.device;
            logger.debug(`Subscribing to topic: ${deviceTopic}`, 'tuya mqtt');
            
            this.client.subscribe(deviceTopic, (err) => {
                if (err) {
                    logger.error(`Failed to subscribe to device updates: ${err.message}`, 'tuya mqtt');
                } else {
                    this.subscriptions.add(deviceTopic);
                    logger.info('Successfully subscribed to device topic', 'tuya mqtt');
                }
            });
        });

        this.client.on('message', (topic, message) => {
            this.lastMessageTime = Date.now();
            logger.debug(`Received raw message on topic ${topic} at ${new Date(this.lastMessageTime).toISOString()}`, 'tuya mqtt');
            this._handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
            logger.error(`MQTT error: ${error.message}`, 'tuya mqtt');
        });

        this.client.on('close', () => {
            const wasConnected = this.connected;
            this.connected = false;
            logger.warn(`MQTT connection closed. Was previously connected: ${wasConnected}`, 'tuya mqtt');
            
            if (this.onDisconnect) {
                this.onDisconnect();
            }
        });

        this.client.on('offline', () => {
            logger.warn('MQTT client went offline', 'tuya mqtt');
        });

        this.client.on('packetreceive', (packet) => {
            // Update last message time for any packet type
            this.lastMessageTime = Date.now();
            logger.debug(`Received MQTT packet type: ${packet.cmd}`, 'tuya mqtt');
        });

        this.client.on('end', () => {
            logger.info('MQTT client connection ended', 'tuya mqtt');
        });

    }

    /**
     * Handle incoming MQTT message
     * @private
     */
    _handleMessage(topic, message) {
        try {
            const payload_str = message.toString('utf8');
            
            // Check if the payload is a valid JSON string
            if (!isJSONString(payload_str)) {
                logger.error(`Invalid JSON received from Tuya`, 'tuya mqtt');
                return;
            }
            
            // Parse the message
            const msg_dict = JSON.parse(payload_str);
            const t = msg_dict.t || '';
            
            logger.debug(`Processing message: ${JSON.stringify({
                topic,
                protocol: msg_dict.protocol,
                t: msg_dict.t,
                pv: msg_dict.pv,
                dataLength: msg_dict.data?.length || 0
            })}`, 'tuya mqtt');
            
            // Decode the data
            const decrypted_data = this._decodeMessage(msg_dict.data, this.mqttConfig.password, t);

            if (decrypted_data === null) {
                logger.error(`Failed to decode data from Tuya`, 'tuya mqtt');
                return;
            }

            // Parse the decrypted data
            const data = JSON.parse(decrypted_data);
            logger.debug(`Successfully decoded message for device: ${data.devId}`, 'tuya mqtt');
            
            if (this.onMessage) {
                this.onMessage({
                    id: data.devId,
                    payload: data.status[0]
                });
            }
        } catch (error) {
            logger.error(`Failed to process MQTT message: ${error.message}`, 'tuya mqtt');
            logger.debug(`Error stack: ${error.stack}`, 'tuya mqtt');
        }
    }

    /**
     * Decode encrypted message from Tuya
     * @private
     */
    _decodeMessage(b64msg, password, t) {
        try {
            const key = password.slice(8, 24);
            const decipher = crypto.createDecipheriv('aes-128-ecb', key, '');
            let msg = decipher.update(Buffer.from(b64msg, 'base64'));
            msg = Buffer.concat([msg, decipher.final()]);
            return msg.toString('utf8');
        } catch (error) {
            logger.error(`Failed to decode message: ${error.message}`, 'tuya mqtt');
            return null;
        }
    }
}

module.exports = TuyaMqttClient;