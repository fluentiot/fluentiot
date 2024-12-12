const mqtt = require('mqtt');
const crypto = require('crypto');
const logger = require('./../../commons/logger');
const { isJSONString } = require('./../../utils/index');

/**
 * Simplified Tuya MQTT client
 */
class TuyaMqttClient {
    constructor(mqttConfig, settings) {
        this.mqttConfig = mqttConfig;
        this.settings = settings;
        
        this.client = null;
        this.connected = false;
        
        this.onMessage = null;
        this.onDisconnect = null;
    }

    /**
     * Start MQTT connection
     */
    async start() {
        try {
            logger.debug(`Connecting to MQTT broker: ${this.mqttConfig.url}`, 'tuya mqtt');
            
            this.client = mqtt.connect(this.mqttConfig.url, {
                clientId: this.mqttConfig.client_id,
                username: this.mqttConfig.username,
                password: this.mqttConfig.password
            });

            this._setupEventHandlers();
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
        if (this.client) {
            this.client.end();
            this.client = null;
        }
        this.connected = false;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.client?.connected;
    }

    /**
     * Setup MQTT event handlers
     * @private
     */
    _setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info('MQTT Connected', 'tuya mqtt');
            this.connected = true;
            
            // Subscribe to device updates
            const deviceTopic = this.mqttConfig.source_topic.device;
            
            this.client.subscribe(deviceTopic, (err) => {
                if (err) {
                    logger.error(`Failed to subscribe to device updates: ${err.message}`, 'tuya mqtt');
                } else {
                    logger.info('Listening to devices', 'tuya mqtt');
                }
            });
        });

        this.client.on('message', (topic, message) => {
            this._handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
            logger.error(`MQTT error: ${error.message}`, 'tuya mqtt');
        });

        this.client.on('close', () => {
            this.connected = false;
            logger.warn('MQTT connection closed', 'tuya mqtt');
            if (this.onDisconnect) {
                this.onDisconnect();
            }
        });
    }

    /**
     * Handle incoming MQTT message
     * @private
     */
    _handleMessage(topic, message) {
        try {
            const payload_str = message.toString('utf8');
            //logger.debug(`Received MQTT message on topic ${topic}: ${payload_str}`, 'tuya mqtt');
            
            // Check if the payload is a valid JSON string
            if (!isJSONString(payload_str)) {
                logger.error(`Invalid JSON received from Tuya`, 'tuya mqtt');
                return;
            }
            
            // Parse the message
            const msg_dict = JSON.parse(payload_str);
            const t = msg_dict.t || '';
            
            // Decode the data
            const decrypted_data = this._decodeMessage(msg_dict.data, this.mqttConfig.password, t);

            if (!decrypted_data) {
                logger.error(`Failed to decode data from Tuya`, 'tuya mqtt');
                return;
            }

            // Parse the decrypted data
            const data = JSON.parse(decrypted_data);
            
            // Format for device manager
            if (this.onMessage && data.devId && data.status && data.status.length > 0) {
                //logger.debug(`Decoded message: ${JSON.stringify(data)}`, 'tuya mqtt');
                this.onMessage({
                    id: data.devId,
                    payload: data.status[0]
                });
            }
        } catch (error) {
            logger.error(`Failed to process message: ${error.message}`, 'tuya mqtt');
        }
    }

    /**
     * Decode encrypted message from Tuya
     * Using the exact same method as the original working code
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