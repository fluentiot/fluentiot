const { EventEmitter } = require('events');
const mqtt = require('mqtt');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');

const logger = require('./../../commons/logger')
const { isJSONString } = require('./../../utils/index');

class TuyaOpenMQ extends EventEmitter {

    /**
     * Constructor
     * 
     * @param {object} settings - Auth details
     * @param {*} TuyaOpenAPI - API interface
     */
    constructor(settings, TuyaOpenAPI) {
        super();
        this.api = TuyaOpenAPI;
        this.settings = settings;

        this.client = null;
        this.mq_config = null;
        this.message_listeners = new Set();

        this._connected = false;
        this._connecting = false;
        this._reconnect_interval = 600000 // 10 minutes
    }

    /**
     * Start MQTT connection
     */
    start() {
        logger.debug(`Starting MQTT connection`, 'tuya mqtt')
        this.__run_mqtt();

        // Reconnect MQTT every x minutes
        setInterval(() => {
            this.reconnect(true);
        }, this._reconnect_interval);
    }

    /**
     * Stop client and connection
     */
    stop() {
        this._connected = false;
        this.client.end();
    }

    /**
     * Run MQTT
     * 
     * @private
     */
    async __run_mqtt() {
        const mq_config = await this._get_mqtt_config();
        if (mq_config === null) {
            logger.error('Error while getting MQTT config','tuya mqtt');
            return;
        }

        this.mq_config = mq_config;

        logger.debug(`Connecting to "${mq_config.url}"`,'tuya mqtt');
        this.client = this._connect(mq_config);
    }

    /**
     * MQTT config
     * 
     * @returns {object} - Response from Tuya API
     */
    async _get_mqtt_config() {
        const body = {
            uid: this.settings.token_info.uid,
            link_id: `tuya-iot-app-sdk-node.${uuidv1()}`,
            link_type: 'mqtt',
            topics: 'device',
            msg_encrypted_version: '1.0',
        };

        logger.debug(`Fetching auth details from Tuya Open API for MQTT connection`,'tuya mqtt');
        let response = await this.api.post('/v1.0/open-hub/access/config', body);

        if (!response || response.success === false) {
            logger.error(`Failed to get MQTT config from Tuya`, 'tuya mqtt');
            return null;
        }

        return response.result;
    }

    /**
     * Decode the MQTT message
     * 
     * @param {string} b64msg - Encoded string from Tuya
     * @param {string} password - User password used to decode
     * @param {string} t - Timestamp
     * @returns string - Decoded message
     */
    _decode_mq_message(b64msg, password, t) {
        const key = password.slice(8, 24);
        const decipher = crypto.createDecipheriv('aes-128-ecb', key, '');
        let msg = decipher.update(Buffer.from(b64msg, 'base64'));
        msg = Buffer.concat([msg, decipher.final()]);
        msg = msg.toString('utf8');
        return msg;
    }

    /**
     * Message received from MQTT
     * 
     * @param {object} user_data - User data that was used for the connection, used for decoding
     * @param {string} payload - Raw encoded device data from Tuya
     */
    _on_message(user_data, payload) {
        // Check if the payload is a valid JSON string
        const payload_str = payload.toString('utf8')
        if (!isJSONString(payload_str)) {
            logger.error(`Invalid JSON received from Tuya`, 'tuya mqtt');
            return;
        }
        
        // Decode the payload
        const msg_dict = JSON.parse(payload.toString('utf8'));
        const t = msg_dict.t || '';
        const decrypted_data = this._decode_mq_message(msg_dict.data, user_data.password, t);

        if (decrypted_data === null) {
            logger.error(`Failed to decode data from Tuya`, 'tuya mqtt');
            return;
        }

        // Send data to listeners
        msg_dict.data = decrypted_data;
        for (const listener of this.message_listeners) {
            listener(msg_dict);
        }
    }

    /**
     * Reconnect to MQTT
     * 
     * @param {boolean} force - Force reconnect even if already connected
     */
    async reconnect(force = false) {
        if(this._connected && force !== true) {
            logger.debug('Cancelling reconnect, already connected','tuya mqtt');
            return false;
        }

        // If already attemping to connect
        if(this._connecting === true) {
            logger.debug('Cancelling reconnect, already connecting','tuya mqtt');
            return false;
        }

        logger.debug(`Restarting MQTT Connection. Force connection: ${force}`,'tuya mqtt');
        this._connecting = true;

        if(this._connected) { this.stop(); }

        // Try and get latest config
        const mq_config = await this._get_mqtt_config();
        if (mq_config === null) {
            logger.error('Error while getting MQTT config, attempting full reconnect in 5 seconds','tuya mqtt');
            setTimeout(() => {
                this.__run_mqtt()
            }, 5000);
            return false;
        }

        this.mq_config = mq_config;

        this.client.options.clientId = mq_config.client_id;
        this.client.options.username = mq_config.username;
        this.client.options.password = mq_config.password;
        this.client.reconnect();

        return true
    }

    /**
     * Connect to MMQT server
     * 
     * @private
     * @param {object} mq_config - Auth for connection
     * @returns {object} - Client for MMQT
     */
    _connect(mq_config) {
        this._connecting = true;
        const client = mqtt.connect(mq_config.url, {
            clientId: mq_config.client_id,
            username: mq_config.username,
            password: mq_config.password,
        });

        client.on('connect',  () => {
            logger.info('Tuya MQTT Connected','tuya mqtt');
            this._connecting = false;
            this._connected = true;

            client.subscribe(mq_config.source_topic.device, (err) => {
                logger.info('Listening to devices','tuya mqtt');
            })
        });

        client.on('message', (topic, message) => {
            this._on_message(mq_config, message);
        })

        client.on('error', function (err) {
            logger.error(err, 'tuya mqtt');
        });

        client.on('close', () => {
            this._connected = false;
            logger.warn('Connection to MQTT broker lost. Attempting to reconnect...','tuya mqtt');

            if (this._connecting === false) {
                this.reconnect();
            }
        });

        return client;
    }

    /**
     * Add message listener
     * 
     * @param {object} listener - Call back
     */
    add_message_listener(listener) {
        this.message_listeners.add(listener);
    }

    /**
     * Remove message listener
     * 
     * @param {object} listener - Callback previously connected
     */
    remove_message_listener(listener) {
        this.message_listeners.delete(listener);
    }

}

module.exports = TuyaOpenMQ;
