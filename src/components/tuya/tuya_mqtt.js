const { EventEmitter } = require('events');
const mqtt = require('mqtt');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');

const logger = require('./../../utils/logger')

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
    }

    /**
     * MQTT config
     * 
     * @returns {object} - Response from Tuya API
     */
    async _get_mqtt_config() {
        const data = {
            uid: this.settings.token_info.uid,
            link_id: `tuya-iot-app-sdk-node.${uuidv1()}`,
            link_type: 'mqtt',
            topics: 'device',
            msg_encrypted_version: '1.0',
        };

        logger.debug(`Fetching auth details from Tuya Open API for MQTT connection`,'tuya');
        let response = await this.api.post('/v1.0/open-hub/access/config', data);
        return response.result;
    }

    /**
     * Decode the MQTT message
     * 
     * @param {string} b64msg - Encoded string from Tuya
     * @param {*} password - User password used to decode
     * @param {*} t - ??
     * @returns 
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
        const msg_dict = JSON.parse(payload.toString('utf8'));
        const t = msg_dict.t || '';
        const decrypted_data = this._decode_mq_message(msg_dict.data, user_data.password, t);

        if (decrypted_data === null) {
            logger.error(`Failed to decode data from Tuya`, 'tuya');
            return;
        }

        // Send data to listeners
        msg_dict.data = decrypted_data;
        for (const listener of this.message_listeners) {
            listener(msg_dict);
        }
    }


    /**
     * Start MQTT connection
     */
    start() {
        this.__run_mqtt();

        //Reconnect
        setTimeout(() => {
            this.reconnect(true);
        }, 30000);
    }

    /**
     * Stop client and connection
     */
    stop() {
        this.client.end();
        this._connected = false;
    }

    /**
     * Run MQTT
     * 
     * @private
     */
    async __run_mqtt() {
        const mq_config = await this._get_mqtt_config();
        if (mq_config === null) {
            logger.error('Error while getting MQTT config','tuya');
            return;
        }

        this.mq_config = mq_config;

        logger.debug(`Connecting to "${mq_config.url}"`,'tuya');
        this.client = this._mmqtConnect(mq_config);
    }

    /**
     * Reconnect to MQTT
     * 
     * @param {boolean} force - Force reconnect even if already connected
     */
    async reconnect(force = false) {
        if(this._connected && force !== true) {
            logger.debug('Cancelling reconnect, already connected','tuya');
            return;
        }

        // If already attemping to connect
        if(this._connecting === true) {
            logger.debug('Cancelling reconnect, already connecting','tuya');
            return;
        }

        logger.debug('Restarting connection','tuya');
        if(this._connected) { this.stop(); }

        this._connecting = true;
        const mq_config = await this._get_mqtt_config();
        if (mq_config === null) {
            logger.error('Error while getting MQTT config','tuya');
            return;
        }

        this.mq_config = mq_config;

        this.client.options.clientId = mq_config.client_id;
        this.client.options.username = mq_config.username;
        this.client.options.password = mq_config.password;
        this.client.reconnect();
    }

    /**
     * Connect to MMQT server
     * 
     * @param {object} mq_config - Auth for connection
     * @returns {object} - Client for MMQT
     */
    _mmqtConnect(mq_config) {
        this._connecting = true;
        const client = mqtt.connect(mq_config.url, {
            clientId: mq_config.client_id,
            username: mq_config.username,
            password: mq_config.password,
        });

        client.on('connect',  (a, b, c) => {
            logger.info('Tuya MQTT Connected','tuya');
            this._connecting = false;
            this._connected = true;

            client.subscribe(mq_config.source_topic.device, (err) => {
                logger.info('Listening to devices','tuya');
            })
        });

        client.on('message', (topic, message) => {
            this._on_message(mq_config, message);
        })

        client.on('error', function (err) {
            logger.error(err, 'tuya');
        });

        client.on('close', () => {
            this._connected = false;
            logger.warn('Connection to MQTT broker lost. Attempting to reconnect...','tuya');
            this.reconnect();
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
