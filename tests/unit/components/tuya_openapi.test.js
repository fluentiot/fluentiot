const TuyaOpenApi = require('./../../../src/components/tuya/tuya_openapi');

const mockdate = require('mockdate')

jest.mock('./../../../src/utils/logger')
const logger = require('./../../../src/utils/logger')

jest.mock('axios');
const axios = require('axios');

let tuyaOpenAPI;

beforeEach(() => {
    tuyaOpenAPI = new TuyaOpenApi('example.com', 'accessId', 'accessSecret', 'username', 'password');
});

describe('TuyaOpenAPI basics', () => {

    it('should initialize correctly', () => {
        expect(tuyaOpenAPI.endpoint).toBe('example.com');
        expect(tuyaOpenAPI.access_id).toBe('accessId');
        expect(tuyaOpenAPI.access_secret).toBe('accessSecret');
        expect(tuyaOpenAPI.__username).toBe('username');
        expect(tuyaOpenAPI.__password).toBe('password');
        expect(tuyaOpenAPI.token_info).toBe(null);
        expect(tuyaOpenAPI.onConnect).toBe(null);
    });

    it('should not be connected by default', () => {
        expect(tuyaOpenAPI.isConnected()).toBe(false)
    });

    it('should return true if access token is set', () => {
        tuyaOpenAPI.token_info = { access_token: 'abc' }
        expect(tuyaOpenAPI.isConnected()).toBe(true)
    });

})

describe('TuyaOpenAPI messaging signing', () => {

    afterEach(() => {
        mockdate.reset()
    })

    it('should calculate sign correctly based on a static time', () => {
        const method = 'GET';
        const path = '/v1.0/devices';
        const params = { page: 1, limit: 10 };
        const body = { name: 'Device' };

        // Set the time to a static value and verify the sign
        mockdate.set('2021-05-11T12:00:46.000Z');
        const [sign, t] = tuyaOpenAPI._calculate_sign(method, path, params, body);
        expect(sign).toBe('E4819312FEDDBD8C585FE912E7192845A5BA28DDE606E0C7A79589F737021F6B');
        expect(t).toBe(1620734446000);

        // Change the time and verify that the sign is different
        mockdate.reset()
        const [sign2, t2] = tuyaOpenAPI._calculate_sign(method, path, params, body);
        expect(sign2).not.toBe('E4819312FEDDBD8C585FE912E7192845A5BA28DDE606E0C7A79589F737021F6B');
        expect(t2).not.toBe(1620734446000);
    });

    it('should calculate sign correctly when no body or params', () => {
        const method = 'GET';
        const path = '/v1.0/devices';
        const params = { page: 1, limit: 10 };
        const body = { name: 'Device' };
        mockdate.set('2021-05-11T12:00:46.000Z');

        // No params
        let [sign, t] = tuyaOpenAPI._calculate_sign(method, path, null, body);
        expect(sign).toBe('1089014423E739947C3E45BA5AC5142F7BC1DAF8D66BDFFE7275374A5FDAC313');
        expect(t).toBe(1620734446000);

        // No body
        [sign, t] = tuyaOpenAPI._calculate_sign(method, path, params, null);
        expect(sign).toBe('79B70C054B83919F04791B9CAB8DD6FB9FBB49B92155B40099AEE5A036F6CA40');
        expect(t).toBe(1620734446000);

        // No body or params
        [sign, t] = tuyaOpenAPI._calculate_sign(method, path, null, null);
        expect(sign).toBe('FEBDAECBEAEC36F45BF2DBC07157AB55731BADF83136F13E25F0AEB62189EFDA');
        expect(t).toBe(1620734446000);
    });

    it('should calculate sign correctly with token info', () => {
        const method = 'GET';
        const path = '/v1.0/devices';
        const params = { page: 1, limit: 10 };
        const body = { name: 'Device' };
        mockdate.set('2021-05-11T12:00:46.000Z');

        // With token
        tuyaOpenAPI.token_info = { access_token: 'abc' }
        let [sign, t] = tuyaOpenAPI._calculate_sign(method, path, params, body);
        expect(sign).toBe('D30359CB2EA69E090D7EEB41D2D5ABF701087635C79DD33C22DB72F3A92F1AA4');

        // Changing the token does not change the sign
        tuyaOpenAPI.token_info = { access_token: '111122223asdasdasd333' }
        [sign, t] = tuyaOpenAPI._calculate_sign(method, path, params, body);
        expect(sign).toBe('D30359CB2EA69E090D7EEB41D2D5ABF701087635C79DD33C22DB72F3A92F1AA4');
    });

})

describe('TuyaOpenAPI connection', () => {

    it('will try and connect', async () => {
        const fakeReturn = {
            success: true,
            result: {
                expire: 100,
                access_token: 'yyy_access_token',
                refresh_token: 'yyy_refresh_token',
                uid: 'yyy_uid',
                platform_url: 'yyy_platform_url'
            }
        }
        const spy = jest.spyOn(tuyaOpenAPI, 'post').mockImplementation(() => fakeReturn);

        tuyaOpenAPI.onConnect = jest.fn()

        const result = await tuyaOpenAPI.connect();

        expect(result).toStrictEqual(fakeReturn)
        expect(spy).toHaveBeenCalledWith('/v1.0/iot-01/associated-users/actions/authorized-login', {
            username: 'username',
            password: '5f4dcc3b5aa765d61d8327deb882cf99',
            country_code: '1',
            schema: 'tuyaSmart'
        })

        expect(tuyaOpenAPI.token_info.expire_time).toBe(100000)
        expect(tuyaOpenAPI.token_info.access_token).toBe('yyy_access_token')
        expect(tuyaOpenAPI.token_info.refresh_token).toBe('yyy_refresh_token')
        expect(tuyaOpenAPI.token_info.uid).toBe('yyy_uid')
        expect(tuyaOpenAPI.token_info.platform_url).toBe('yyy_platform_url')
        expect(tuyaOpenAPI.onConnect).toHaveBeenCalled()
        expect(tuyaOpenAPI.isConnected()).toBe(true)
    })

    it('fails to connect', async () => {
        jest.spyOn(tuyaOpenAPI, 'post').mockImplementation(() => { return false });
        const result = await tuyaOpenAPI.connect();

        // spy on logger.error and check it was called
        jest.spyOn(logger, 'error').mockImplementation(() => { });
        expect(logger.error).toHaveBeenCalled()

        expect(result).toBe(false)
        expect(tuyaOpenAPI.token_info).toBe(null)
        expect(tuyaOpenAPI.isConnected()).toBe(false)
    })

    it('will try and refresh and token will be updated', async () => {
        tuyaOpenAPI.token_info = {
            expire_time: 100000,
            refresh_token: 'foobar'
        }
        const path = '/v1.0/devices/update'

        const getSpy = jest.spyOn(tuyaOpenAPI, 'get').mockImplementation(() => {
            return {
                success: true,
                result: {
                    expire: 100,
                    access_token: 'yyy_access_token',
                    refresh_token: 'yyy_refresh_token',
                    uid: 'yyy_uid',
                    platform_url: 'yyy_platform_url'
                }
            }
        });
        const result = await tuyaOpenAPI.__refresh_access_token_if_need(path);

        expect(result).toBe(true)
        expect(getSpy).toHaveBeenCalledWith('/v1.0/token/foobar')

        expect(tuyaOpenAPI.token_info.expire_time).toBe(100000)
        expect(tuyaOpenAPI.token_info.access_token).toBe('yyy_access_token')
        expect(tuyaOpenAPI.token_info.refresh_token).toBe('yyy_refresh_token')
        expect(tuyaOpenAPI.token_info.uid).toBe('yyy_uid')
        expect(tuyaOpenAPI.token_info.platform_url).toBe('yyy_platform_url')
    })

    it('will not try to refresh token for certain urls', async () => {
        tuyaOpenAPI.__login_path = '/login'
        tuyaOpenAPI.__refresh_path = '/refresh'
        tuyaOpenAPI.__mmqt_config_path = '/mqqt';

        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/login')).toBe(false)
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/refresh')).toBe(false)
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/mqqt')).toBe(false)
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/mqqt/deeper')).toBe(false)
    })

    it('will not try to refresh token if no refresh token exists', async () => {
        tuyaOpenAPI.token_info = { refresh_token: null }
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/test')).toBe(false)

        tuyaOpenAPI.token_info = null
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/test')).toBe(false)
    })

    it('will not try to refresh if the token is still valid', async () => {
        tuyaOpenAPI.token_info = {
            refresh_token: 'foobar',
            expire_time: Date.now() + 1000
        }
        expect(await tuyaOpenAPI.__refresh_access_token_if_need('/test')).toBe(false)
    })

    it('will log an error and return false if it returns a bad response', async () => {
        tuyaOpenAPI.token_info = {
            expire_time: 100000,
            refresh_token: 'foobar'
        }

        const getSpy = jest.spyOn(tuyaOpenAPI, 'get').mockImplementation(() => false);
        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => { });

        const result = await tuyaOpenAPI.__refresh_access_token_if_need('/v1.0/devices/update');

        expect(result).toBe(false)
        expect(getSpy).toHaveBeenCalledWith('/v1.0/token/foobar')
        expect(loggerSpy).toHaveBeenCalledWith('Failed to refresh Tuya OpenAPI token', 'tuya')
    })

    it('will calculate the expire_time correctly', async () => {
        const now = Date.now()
        const expectedExpiredTime = now + (10 * 1000)

        jest.spyOn(tuyaOpenAPI, 'get').mockImplementation(() => {
            return {
                success: true,
                t: now,
                result: {
                    expire: 10
                }
            }
        });

        tuyaOpenAPI.token_info = {
            refresh_token: 'foobar'
        }
        await tuyaOpenAPI.__refresh_access_token()

        expect(tuyaOpenAPI.token_info.expire_time).toBe(expectedExpiredTime)
    })


});


describe('TuyaOpenAPI request', () => {
    let loggerSpy;

    beforeEach(() => {
        tuyaOpenAPI.token_info = {
            access_token: 'fake-access-token'
        }
        loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => { });
    })

    it('will make a basic POST request successfully', async () => {
        const fakeReturn = {
            success: true,
            data: {
                devices: [
                    { id: 123, name: 'Device 1' },
                    { id: 456, name: 'Device 2' }
                ]
            }
        }
        axios.post.mockResolvedValue(fakeReturn);

        const params = null
        const body = null
        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', params, body)

        expect(axios.post).toHaveBeenCalledWith('example.com/v1.0/devices', null, {
            headers: {
                'client_id': 'accessId',
                'sign': expect.any(String),
                'sign_method': 'HMAC-SHA256',
                'access_token': tuyaOpenAPI.token_info.access_token,
                't': expect.any(String),
                'lang': 'en'
            }
        })

        expect(result).toStrictEqual(fakeReturn.data)
    })

    it('logs an error if no result from tuya', async () => {
        axios.post.mockResolvedValue(null);
        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', null, null)
        expect(result).toBe(false)
        expect(loggerSpy).toHaveBeenCalledWith('No result from Tuya Open API', 'tuya')
    })

    it('logs and error if call to tuya was not successful', async () => {
        axios.post.mockResolvedValue({ success: false });
        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', null, null)
        expect(result).toBe(false)
        expect(loggerSpy).toHaveBeenCalledWith('Did not receive success from tuya', 'tuya')
    })

    it('logs an error if was successful but data was not returned from tuya', async () => {
        axios.post.mockResolvedValue({ success: true });
        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', null, null)
        expect(result).toBe(false)
        expect(loggerSpy).toHaveBeenCalledWith('Tuya returned success but no data received', 'tuya')
    })

    it('will attempt to refresh the access token', async () => {
        axios.post.mockResolvedValue({
            success: true,
            data: { code: 1010 }
        });
        tuyaOpenAPI.__refresh_access_token = jest.fn().mockImplementation(() => false);

        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', null, null)
        expect(result).toBe(false)
        expect(tuyaOpenAPI.__refresh_access_token).toHaveBeenCalled()
        expect(loggerSpy).toHaveBeenCalledWith('Tuya API token expired but failed to refresh it', 'tuya')
    })

    it('will log an error if axios throws an error', async () => {
        axios.post.mockRejectedValue('error');
        const result = await tuyaOpenAPI.__request('POST', '/v1.0/devices', null, null)
        expect(result).toBe(false)
        expect(loggerSpy).toHaveBeenCalledWith('Failed to send request to Tuya Open API', 'tuya')
        expect(loggerSpy).toHaveBeenCalledWith('error', 'tuya')
    })

})


describe('TuyaOpenAPI RESTful methods', () => {
    let tuyaOpenAPI
    let spy

    beforeEach(() => {
        tuyaOpenAPI = new TuyaOpenApi('example.com', 'accessId', 'accessSecret', 'username', 'password');
        spy = jest.spyOn(tuyaOpenAPI, '__request').mockImplementation(() => {
            return true
        });
    });

    it('should send GET request', async () => {
        const result = await tuyaOpenAPI.get('/v1.0/devices', { page: 1, limit: 10 });
        expect(spy).toHaveBeenCalledWith('GET', '/v1.0/devices', { page: 1, limit: 10 }, null)
        expect(result).toBe(true)
    });

    it('should send POST request', async () => {
        const result = await tuyaOpenAPI.post('/v1.0/devices', { content: true });
        expect(spy).toHaveBeenCalledWith('POST', '/v1.0/devices', null, { content: true })
        expect(result).toBe(true)
    });

    it('should send PUT request', async () => {
        const result = await tuyaOpenAPI.put('/v1.0/devices', { content: true });
        expect(spy).toHaveBeenCalledWith('PUT', '/v1.0/devices', null, { content: true })
        expect(result).toBe(true)
    });

    it('should send DELETE request', async () => {
        const result = await tuyaOpenAPI.delete('/v1.0/devices', { record_id:123 });
        expect(spy).toHaveBeenCalledWith('DELETE', '/v1.0/devices', { record_id:123 }, null)
        expect(result).toBe(true)
    });

});


describe('TuyaOpenAPI integration test', () => {

    it('will connect and make a GET request without refreshing the token', async () => {
        // Setup a fake return for successful connect
        const fakeConnectReturn = {
            success: true,
            t: Date.now(),
            result: {
                expire: 7200,
                access_token: 'yyy_access_token',
                refresh_token: 'yyy_refresh_token',
                uid: 'yyy_uid',
                platform_url: 'yyy_platform_url'
            }
        }
        jest.spyOn(tuyaOpenAPI, 'post').mockImplementation((path) => {
            if (path === tuyaOpenAPI.__login_path) {
                return fakeConnectReturn
            }
        });

        // Setup a fake return for successful get
        const fakeGetReturn = {
            success: true,
            data: {
                devices: [
                    { id: 123, name: 'Device 1' },
                    { id: 456, name: 'Device 2' }
                ]
            }
        }
        jest.spyOn(axios, 'get').mockImplementation(() => {
            return fakeGetReturn
        });

        // Spy on __refresh_access_token to make sure it doesn't get called
        tuyaOpenAPI.__refresh_access_token = jest.fn()

        // Attempts to connect
        const connectResponse = await tuyaOpenAPI.connect()

        // Make a get call
        const getResponse = await tuyaOpenAPI.get('/v1.0/devices', { page: 1, limit: 10 });

        expect(tuyaOpenAPI.isConnected()).toBe(true)
        expect(connectResponse).toStrictEqual(fakeConnectReturn)
        expect(getResponse).toStrictEqual(fakeGetReturn.data)
        expect(tuyaOpenAPI.__refresh_access_token).not.toHaveBeenCalled()
    })


    it('will connect, token has expired, then will refresh the token and carry out the get command', async () => {
        // Setup a fake return for successful connect
        const fakeConnectReturn = {
            success: true,
            t: Date.now(),
            result: {
                expire: -1, // Expire it
                access_token: 'yyy_access_token',
                refresh_token: 'yyy_refresh_token',
                uid: 'yyy_uid',
                platform_url: 'yyy_platform_url'
            }
        }
        jest.spyOn(tuyaOpenAPI, 'post').mockImplementation((path) => {
            if (path === tuyaOpenAPI.__login_path) {
                return fakeConnectReturn
            }
        });

        // Setup a fake return for successful get
        const fakeGetReturn = {
            success: true,
            data: {
                devices: [
                    { id: 123, name: 'Device 1' },
                    { id: 456, name: 'Device 2' }
                ]
            }
        }
        jest.spyOn(axios, 'get').mockImplementation(() => {
            return fakeGetReturn
        });

        // Spy on __refresh_access_token to make sure it doesn't get called
        tuyaOpenAPI.__refresh_access_token = jest.fn()

        // Connect
        const connectResponse = await tuyaOpenAPI.connect()

        // Make a get call
        // This will make a call to refresh the access token (because we forced it to be expired)
        const getResponse = await tuyaOpenAPI.get('/v1.0/devices', { page: 1, limit: 10 });

        expect(tuyaOpenAPI.isConnected()).toBe(true)
        expect(connectResponse).toStrictEqual(fakeConnectReturn)
        expect(getResponse).toStrictEqual(fakeGetReturn.data)
        expect(tuyaOpenAPI.__refresh_access_token).toHaveBeenCalled()
    })

})
