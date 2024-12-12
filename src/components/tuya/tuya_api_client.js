const crypto = require('crypto');
const axios = require('axios');
const logger = require('./../../logger');

/**
 * Simplified Tuya API client
 */
class TuyaApiClient {
    constructor(endpoint, accessId, accessSecret, username, password) {
        this.endpoint = endpoint;
        this.accessId = accessId;
        this.accessSecret = accessSecret;
        this.username = username;
        this.password = password;

        this.token = null;
        this.tokenExpiry = 0;
        this.isConnecting = false;
    }

    /**
     * Connect to API
     */
    async connect() {
        if (this.isConnecting) {
            logger.debug('Already attempting to connect, skipping duplicate request', 'tuya api');
            return false;
        }

        try {
            this.isConnecting = true;
            const response = await this._request('POST', '/v1.0/iot-01/associated-users/actions/authorized-login', null, {
                username: this.username,
                password: crypto.createHash('md5').update(this.password, 'utf8').digest('hex'),
                country_code: '1',
                schema: 'tuyaSmart'
            }, true); // Add flag for login request

            if (!response?.success) {
                throw new Error('Failed to authenticate with Tuya API');
            }

            this._updateToken(response);
            return true;
        } catch (error) {
            logger.error(`API connection failed: ${error.message}`, 'tuya api');
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            const response = await this.get('/v1.0/statistics/overview');
            return response?.success === true;
        } catch {
            return false;
        }
    }

    /**
     * Make GET request
     */
    async get(path, params = null) {
        return this._request('GET', path, params);
    }

    /**
     * Make POST request
     */
    async post(path, body = null) {
        return this._request('POST', path, null, body);
    }

    /**
     * Make HTTP request
     * @private
     */
    async _request(method, path, params = null, body = null, isLoginRequest = false) {
        // Only refresh token if this is not a login request and token is expired or about to expire
        if (!isLoginRequest && this.token) {
            const now = Date.now();
            // Refresh if token is expired or will expire in next 60 seconds
            if (now >= (this.tokenExpiry - 60000)) {
                await this.connect();
            }
        }

        const [sign, t] = this._calculateSign(method, path, params, body);
        const headers = {
            'client_id': this.accessId,
            'sign': sign,
            'sign_method': 'HMAC-SHA256',
            'access_token': this.token?.access_token || '',
            't': t.toString(),
            'lang': 'en'
        };

        try {
            //logger.debug(`API request: ${method} ${this.endpoint}${path}`, 'tuya api');
            const response = await axios({
                method,
                url: this.endpoint + path,
                params,
                data: body,
                headers
            });

            return response.data;
        } catch (error) {
            if (error.response?.data?.code === 1010 && !isLoginRequest) {  // Token invalid
                await this.connect();
                return this._request(method, path, params, body);
            }
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    /**
     * Calculate request signature
     * @private
     */
    _calculateSign(method, path, params, body) {
        const t = Date.now();
        const contentHash = crypto.createHash('sha256')
            .update(body ? JSON.stringify(body) : '')
            .digest('hex')
            .toLowerCase();

        let signStr = method + '\n' + contentHash + '\n\n' + path;
        
        if (params) {
            const query = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
            if (query) {
                signStr += '?' + query;
            }
        }

        const message = this.accessId + (this.token?.access_token || '') + t + signStr;
        const sign = crypto.createHmac('sha256', this.accessSecret)
            .update(message)
            .digest('hex')
            .toUpperCase();

        return [sign, t];
    }

    /**
     * Update token data
     * @private
     */
    _updateToken(response) {
        const result = response.result || {};
        this.token = {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            uid: result.uid
        };

        // result.expire is in seconds, need to convert to milliseconds
        const expiresInMs = (result.expire_time || 0) * 1000;
        this.tokenExpiry = Date.now() + expiresInMs;

        logger.debug(`Token updated, expires in ${expiresInMs/1000} seconds at ${new Date(this.tokenExpiry)}`, 'tuya api');
    }
}

module.exports = TuyaApiClient;