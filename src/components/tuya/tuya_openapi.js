const crypto = require('crypto');
const axios = require('axios');

const logger = require('./../../utils/logger')

const TUYA_ERROR_CODE_TOKEN_INVALID = 1010;

const TO_C_SMART_HOME_TOKEN_API = '/v1.0/iot-01/associated-users/actions/authorized-login';
const TO_C_SMART_HOME_MQTT_CONFIG_API = '/v1.0/open-hub/access/config';

/**
 * Tuya Token Interface
 * 
 * @class
 */
class TuyaTokenInfo {
    constructor(tokenResponse) {
        const result = tokenResponse.result || {};
        this.expire_time = (tokenResponse.t || 0) + (result.expire || result.expire_time || 0) * 1000;
        this.access_token = result.access_token || '';
        this.refresh_token = result.refresh_token || '';
        this.uid = result.uid || '';
        this.platform_url = result.platform_url || '';
    }
}

/**
 * Tuya Open HTTP API
 * 
 * @class
 */
class TuyaOpenAPI {

    /**
     * Constructor
     * 
     * @param {*} endpoint 
     * @param {*} access_id 
     * @param {*} access_secret 
     * @param {*} username 
     * @param {*} password 
     */
    constructor(endpoint, access_id, access_secret, username, password) {
        //General config
        this.__login_path = '/v1.0/iot-01/associated-users/actions/authorized-login'
        this.__refresh_path = '/v1.0/iot-03/users/token/'
        this.__smart_token_api = '/v1.0/iot-01/associated-users/actions/authorized-login'

        this.__country_code = '1';
        this.__schema = 'tuyaSmart';
        this.auth_type = 'SMART_HOME';
        this.lang = 'en';

        //Settings
        this.endpoint = endpoint;
        this.access_id = access_id;
        this.access_secret = access_secret;

        this.__username = username;
        this.__password = password;

        //State
        this.token_info = null;
        this.onConnect = null;
    }

    /**
     * 
     * @param {*} method 
     * @param {*} path 
     * @param {*} params 
     * @param {*} body 
     * @returns 
     */
    _calculate_sign(method, path, params = null, body = null) {
        let str_to_sign = method + '\n';

        const content_to_sha256 = body ? JSON.stringify(body) : '';
        str_to_sign += crypto.createHash('sha256').update(content_to_sha256, 'utf8').digest('hex').toLowerCase() + '\n\n' + path;

        if (params && Object.keys(params).length > 0) {
            str_to_sign += '?';
            const sortedParams = Object.keys(params).sort();
            const query_builder = sortedParams.map(key => `${key}=${params[key]}`).join('&');
            str_to_sign += query_builder;
        }

        const t = Date.now();
        let message = this.access_id;
        if (this.token_info) {
            message += this.token_info.access_token;
        }

        message += t + str_to_sign;
        const sign = crypto.createHmac('sha256', this.access_secret).update(message, 'utf8').digest('hex').toUpperCase();
        return [sign, t];
    }

    /**
     * 
     * @param {*} path 
     * @returns 
     */
    async __refresh_access_token_if_need(path) {
        if (path.startsWith(this.__login_path) || path.startsWith(TO_C_SMART_HOME_MQTT_CONFIG_API)) {
            return;
        }

        //Invalid token
        if(!this.token_info || !this.token_info.refresh_token) {
            return;
        }

        //Check if the token has expired
        const now = Date.now();
        if (this.token_info && this.token_info.expire_time && this.token_info.expire_time - 60000 > now) { // 1min
            return;
        }

        logger.debug('Refreshing Tuya token', 'tuya');
        const refresh_token = this.token_info.refresh_token;
        this.token_info = null;

        const response = await this.get(this.__login_path + refresh_token);

        this.token_info = new TuyaTokenInfo(response);
    }

    /**
     * 
     * @param {*} username 
     * @param {*} password 
     * @param {*} country_code 
     * @param {*} schema 
     * @returns 
     */
    async connect(username = '', password = '', country_code = '', schema = '') {
        this.__username = username;
        this.__password = password;
        this.__country_code = country_code;
        this.__schema = schema;

        let response;
        if (this.auth_type === 'CUSTOM') {
            response = await this.post(this.__refresh_path, {
                username: username,
                password: crypto.createHash('sha256').update(password, 'utf8').digest('hex').toLowerCase()
            });
        } else {
            response = await this.post(TO_C_SMART_HOME_TOKEN_API, {
                username: username,
                password: crypto.createHash('md5').update(password, 'utf8').digest('hex'),
                country_code: country_code,
                schema: schema
            });
        }

        if (!response.success) {
            return response;
        }

        this.token_info = new TuyaTokenInfo(response);

        if(this.onConnect) {
            this.onConnect();
        }

        return response;
    }

    /**
     * 
     * @returns 
     */
    is_connected() {
        return !(!this.token_info || this.token_info.access_token.length > 0);
    }

    /**
     * 
     * @param {*} method 
     * @param {*} path 
     * @param {*} params 
     * @param {*} body 
     * @returns 
     */
    async __request(method, path, params = null, body = null) {
        await this.__refresh_access_token_if_need(path);

        const access_token = this.token_info ? this.token_info.access_token : '';
        const [sign, t] = this._calculate_sign(method, path, params, body);
        const headers = {
            'client_id': this.access_id,
            'sign': sign,
            'sign_method': 'HMAC-SHA256',
            'access_token': access_token,
            't': t.toString(),
            'lang': this.lang
        };

        if (path === this.__login_path || path.startsWith(this.__login_path)) {
            headers['dev_lang'] = 'python';
            headers['dev_version'] = 'VERSION';
        }

        const options = {
            method: method,
            url: this.endpoint + path,
            qs: params,
            body: body,
            headers: headers,
            json: true
        };

        logger.debug(`Request: method = ${method}, url = ${options.url}, params = ${params}, body = ${JSON.stringify(body)}, t = ${Date.now()}`,'tuya');

        let result = await axios.post(this.endpoint + path, body, {
            headers
        });

        //Token expired, renew
        if(result.data.code === TUYA_ERROR_CODE_TOKEN_INVALID) {
            this.token_info = null;
            await this.connect(this.__username, this.__password, this.__country_code, this.__schema);

            let result2 = await this.__request(method, path, params, body);
            return result2;
        }

        logger.debug(result.data,'tuya');

        return result.data;
    }

    /**
     * Send Get HTTP Request
     * 
     * @param {string} path - URL path
     * @param {object} params - HTTP query
     * @returns 
     */
    async get(path, params = null) {
        return await this.__request('GET', path, params, null);
    }

    /**
     * Send Post HTTP Request
     * 
     * @param {string} path - URL path
     * @param {object} params - HTTP params
     * @returns 
     */
    async post(path, body = null) {
        return await this.__request('POST', path, null, body);
    }

    /**
     * Send Put HTTP Request
     * 
     * @param {string} path - URL path
     * @param {object} params - HTTP params
     * @returns 
     */
    async put(path, body = null) {
        return await this.__request('PUT', path, null, body);
    }

    /**
     * Send Delete HTTP Request
     * 
     * @param {string} path - URL path
     * @param {object} params - HTTP params
     * @returns 
     */
    async delete(path, params = null) {
        return await this.__request('DELETE', path, params, null);
    }

}

module.exports = TuyaOpenAPI;
