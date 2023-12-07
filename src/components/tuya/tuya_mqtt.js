const { EventEmitter } = require('events');
const mqtt = require('mqtt');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');

const logger = require('./../../utils/logger')

const LINK_ID = `tuya-iot-app-sdk-node.${uuidv1()}`;
const TO_C_SMART_HOME_MQTT_CONFIG_API = '/v1.0/open-hub/access/config';

class TuyaOpenMQ extends EventEmitter {

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

    async _get_mqtt_config() {
        const data = {
            uid: this.settings.token_info.uid,
            link_id: LINK_ID,
            link_type: 'mqtt',
            topics: 'device',
            msg_encrypted_version: '1.0',
        };

        logger.debug(`Fetching auth details from Tuya for MQTT connection`,'tuya');
        let response = await this.api.post(TO_C_SMART_HOME_MQTT_CONFIG_API, data);
        return response.result;
    }

    _decode_mq_message(b64msg, password, t) {
        const key = password.slice(8, 24);
        const decipher = crypto.createDecipheriv('aes-128-ecb', key, '');
        let msg = decipher.update(Buffer.from(b64msg, 'base64'));
        msg = Buffer.concat([msg, decipher.final()]);
        msg = msg.toString('utf8');
        return msg;
    }

    _on_message(user_data, payload) {
        const msg_dict = JSON.parse(payload.toString('utf8'));
        const t = msg_dict.t || '';
        const decrypted_data = this._decode_mq_message(msg_dict.data, user_data.password, t);

        if (decrypted_data === null) {
            return;
        }

        msg_dict.data = decrypted_data;

        for (const listener of this.message_listeners) {
            listener(msg_dict);
        }
    }

    run() {
        this.__run_mqtt();

        //Reconnect
        setTimeout(() => {
            this.reconnect(true);
        }, 30000);
    }

    async __run_mqtt() {
        const mq_config = await this._get_mqtt_config();
        if (mq_config === null) {
            logger.error('Error while getting MQTT config','tuya');
            return;
        }

        this.mq_config = mq_config;

        logger.debug(`Connecting to "${mq_config.url}"`,'tuya');
        this.client = this._start(mq_config);
    }

    async reconnect(force = false) {
        if(this._connected && force !== true) {
            logger.debug('Cancelling reconnect, already connected','tuya');
            return;
        }

        //If already attemping to connect
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

    _start(mq_config) {
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
            logger.error(err);
        });

        client.on('close', () => {
            this._connected = false;
            logger.debug('Connection to MQTT broker lost. Attempting to reconnect in 30 seconds...','tuya');
            setTimeout(() => {
                this.reconnect();
            }, 30000)
        });

        return client;
    }

    start() {
        this.run();
    }

    stop() {
        this.client.end();
        this._connected = false;
    }

    add_message_listener(listener) {
        this.message_listeners.add(listener);
    }

    remove_message_listener(listener) {
        this.message_listeners.delete(listener);
    }

}

module.exports = TuyaOpenMQ;
