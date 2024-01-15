const crypto = require('crypto');
const axios = require('axios');

const logger = require('./../../commons/logger')

const TUYA_ERROR_CODE_TOKEN_INVALID = 1010;

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
     * @param {string} endpoint - 
     * @param {string} access_id - 
     * @param {string} access_secret - 
     * @param {string} username - 
     * @param {string} password - 
     */
    constructor(endpoint, access_id, access_secret, username, password) {
        // General config
        this.__token_path = '/v1.0/iot-01/associated-users/actions/authorized-login'
        this.__login_path = '/v1.0/iot-01/associated-users/actions/authorized-login'
        this.__refresh_path = '/v1.0/token/'
        this.__smart_token_api = '/v1.0/iot-01/associated-users/actions/authorized-login'
        this.__mmqt_config_path = '/v1.0/open-hub/access/config'

        this.__country_code = '1';
        this.__schema = 'tuyaSmart';
        this.__lang = 'en';

        // Settings
        this.endpoint = endpoint;
        this.access_id = access_id;
        this.access_secret = access_secret;

        this.__username = username;
        this.__password = password;

        // State
        this.token_info = null;
        this.onConnect = null;
    }

    /**
     * Calculate sign
     * 
     * @private
     * @param {string} method - HTTP method
     * @param {string} path - URL path
     * @param {string} params - HTTP query
     * @param {string} body - HTTP body
     * @returns array - [sign, t]
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
     * Refresh access token if needed
     * 
     * @param {string} path - URL path being called before checking if a refresh token is needed
     */
    async __refresh_access_token_if_need(path) {
        // If trying to login or get config then don't try and refresh token
        if (path.startsWith(this.__login_path) || path.startsWith(this.__refresh_path) || path.startsWith(this.__mmqt_config_path)) {
            return false
        }

        // Invalid refresh token
        if (!this.token_info?.refresh_token) {
            return false
        }

        // Check if the token has expired or is about to expire
        // Expire time is the time the token expires, when requesting a token the response is similar to...
        // { success:true, t:<Date.now()>, result:{ expire:7200 } }
        // This will take the <t> which is the server current time then add +7200 to the expire time
        const now = Date.now()
        if (!this.token_info?.expire_time || this.token_info.expire_time >= now) {
            return false;
        }

        logger.debug('Tuya OpenAPI token expired, renewing', 'tuya');

        return await this.__refresh_access_token()
    }

    /**
     * Refresh access token
     * 
     * @returns boolean - True if token was refreshed
     */
    async __refresh_access_token() {
        logger.debug('Refreshing Tuya access token', 'tuya');

        // Invalid refresh token
        if (!this.token_info?.refresh_token) {
            logger.warn(`Refresh token is missing, attempting full reconnection`, 'tuya')
            return await this.connect();
        }

        // Get refresh token
        const refreshToken = this.token_info.refresh_token
        this.token_info = null;

        const response = await this.get(this.__refresh_path + refreshToken);

        // Failed to refresh token
        if (response === false || !response.success) {
            logger.error(`Failed to refresh Tuya OpenAPI token`, 'tuya')
            return false
        }

        // Update token info
        this.token_info = new TuyaTokenInfo(response);
        return true
    }

    /**
     * Connect to Tuya Open API
     * 
     * @returns object - HTTP response
     */
    async connect() {
        // Get token data
        this.token_info = null
        let response = await this.post(this.__token_path, {
            username: this.__username,
            password: crypto.createHash('md5').update(this.__password, 'utf8').digest('hex'),
            country_code: this.__country_code,
            schema: this.__schema
        });

        // Handle failed responses
        if (!response.success) {
            logger.error(`Failed to connect to Tuya Open API`, 'tuya');
            return response;
        }

        this.token_info = new TuyaTokenInfo(response);

        // Call back for onConnect
        if(this.onConnect) {
            this.onConnect();
        }

        return true;
    }

    /**
     * Is connected
     * 
     * @returns boolean - True if connected
     */
    isConnected() {
        if (!this.token_info || !this.token_info.access_token) {
            return false;
        }
        return true;
    }
    
    /**
     * Make HTTP request
     * 
     * @param {string} method - HTTP method 
     * @param {string} path - URL path
     * @param {object} params - HTTP query
     * @param {object} body - HTTP body
     * @returns object - HTTP response
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
            'lang': this.__lang
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

        logger.debug(`Request: method = "${method}", url = "${options.url}", params = ${params}, body = ${JSON.stringify(body)}, t = ${Date.now()}`,'tuya');

        // Send request
        let result
        try {
            if(method === 'GET') {
                result = await axios.get(options.url, { headers, params });
            } else if(method === 'POST') {
                result = await axios.post(options.url, body, { headers });
            } else if(method === 'PUT') {
                result = await axios.put(options.url, body, { headers, params });
            } else if(method === 'DELETE') {
                result = await axios.delete(options.url, body, { headers, params });
            }
        }
        catch (error) {
            logger.error(`Failed to send request to Tuya Open API`, 'tuya');
            logger.error(`URL: ${options.url}`, 'tuya');
            logger.error(error, 'tuya');
            return false;
        }

        // No result
        if (!result) {
            logger.error(`No result from Tuya Open API`, 'tuya');
            logger.error(`URL: ${options.url}`, 'tuya');
            return false;
        }

        // Token expired, renew and try again
        if (result.data && result.data.code === TUYA_ERROR_CODE_TOKEN_INVALID) {
            if (await this.__refresh_access_token()) {
                return await this.__request(method, path, params, body);
            }
            logger.error(`Tuya API token expired but failed to refresh it`, 'tuya')
            return false;
        }

        // Data was not returned
        if (!result.data) {
            logger.error(`Tuya did not return any data`, 'tuya')
            logger.error(`URL: ${options.url}`, 'tuya')
            logger.error(result, 'tuya')
            return false;
        }

        // Check if not successful
        if (result.data.success == false) {
            logger.error(`Did not receive success from tuya`, 'tuya')
            logger.error(`URL: ${options.url}`, 'tuya')
            logger.error(result.data, 'tuya')
            return false;
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
