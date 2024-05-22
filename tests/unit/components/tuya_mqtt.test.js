const TuyaOpenMQ = require('./../../../src/components/tuya/tuya_mqtt');
const TuyaOpenAPI = require('./../../../src/components/tuya/tuya_openapi');
jest.mock('./../../../src/components/tuya/tuya_openapi');

jest.mock('./../../../src/commons/logger')
const logger = require('./../../../src/commons/logger')

jest.mock('crypto');
const crypto = require('crypto');

jest.mock('mqtt');
const mqtt = require('mqtt');

const mockTuyaOpenAPI = jest.fn();
TuyaOpenAPI.mockImplementation(() => {
    return {
        post: jest.fn(),
    };
});

describe('TuyaOpenMQ', () => {
    let tuyaOpenMQ;
    let tuyaOpenAPI;

    beforeEach(() => {
        tuyaOpenAPI = new TuyaOpenAPI();

        const settings = {
            token_info: {
                uid: 'abc'
            }
        }
        tuyaOpenMQ = new TuyaOpenMQ(settings, tuyaOpenAPI);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize correctly', () => {
            expect(tuyaOpenMQ.api).toBeInstanceOf(Object);
            expect(tuyaOpenMQ.client).toBeNull();
            expect(tuyaOpenMQ.mq_config).toBeNull();
            expect(tuyaOpenMQ.message_listeners).toBeInstanceOf(Set);
            expect(tuyaOpenMQ._connected).toBe(false);
            expect(tuyaOpenMQ._connecting).toBe(false);
        });
    });

    describe('_get_mqtt_config', () => {
        it('should fetch MQTT config from Tuya API', async () => {
            const response = {
                result: {
                    url: 'mqtt://example.com',
                    client_id: 'client_id',
                    username: 'username',
                    password: 'password',
                    source_topic: {
                        device: 'device_topic',
                    },
                },
            };
            tuyaOpenAPI.post.mockResolvedValue(response);

            const result = await tuyaOpenMQ._get_mqtt_config();

            expect(result).toEqual(response.result);
            expect(tuyaOpenAPI.post).toHaveBeenCalledWith('/v1.0/open-hub/access/config', expect.any(Object));
        });

        it('should return false if failed to fetch MQTT config', async () => {
            tuyaOpenAPI.post.mockResolvedValue(false);

            const result = await tuyaOpenMQ._get_mqtt_config();

            expect(result).toBe(null);
            expect(tuyaOpenAPI.post).toHaveBeenCalledWith('/v1.0/open-hub/access/config', expect.any(Object));
        });
    });

    describe('_decode_mq_message', () => {
        it('should decode the MQTT message', () => {
            const b64msg = 'encoded_message';
            const password = 'password';
            const t = 'timestamp';
            const expectedDecodedMsg = 'decoded_message';

            const decipherMock = {
                update: jest.fn().mockReturnValue(Buffer.from(expectedDecodedMsg, 'utf8')),
                final: jest.fn().mockReturnValue(Buffer.from('')),
            };
            const createDecipherivMock = jest.spyOn(crypto, 'createDecipheriv').mockReturnValue(decipherMock);

            const result = tuyaOpenMQ._decode_mq_message(b64msg, password, t);

            expect(result).toBe(expectedDecodedMsg);
            expect(createDecipherivMock).toHaveBeenCalledWith('aes-128-ecb', password.slice(8, 24), '');
            expect(decipherMock.update).toHaveBeenCalledWith(Buffer.from(b64msg, 'base64'));
            expect(decipherMock.final).toHaveBeenCalled();
        });
    });

    describe('_on_message', () => {
        it('should decode and send the message to listeners', () => {
            const user_data = {
                password: 'password',
            };
            const msg_dict = {
                t: 'timestamp',
                data: 'encoded_data',
            };
            const payload = Buffer.from(JSON.stringify(msg_dict), 'utf8');
            const expectedDecodedData = 'decoded_data';
            tuyaOpenMQ._decode_mq_message = jest.fn().mockReturnValue(expectedDecodedData);

            const listener1 = jest.fn();
            const listener2 = jest.fn();
            tuyaOpenMQ.message_listeners.add(listener1);
            tuyaOpenMQ.message_listeners.add(listener2);

            tuyaOpenMQ._on_message(user_data, payload);

            expect(tuyaOpenMQ._decode_mq_message).toHaveBeenCalledWith(msg_dict.data, user_data.password, msg_dict.t);

            expect(listener1).toHaveBeenCalledWith({ ...msg_dict, data: expectedDecodedData });
            expect(listener2).toHaveBeenCalledWith({ ...msg_dict, data: expectedDecodedData });
        });

        it('should log an error if failed to decode the message', () => {
            const user_data = {
                password: 'password',
            };
            const msg_dict = {
                t: 'timestamp',
                data: 'encoded_data',
            };
            const payload = Buffer.from(JSON.stringify(msg_dict), 'utf8');

            tuyaOpenMQ._decode_mq_message = jest.fn().mockReturnValue(null);
            const loggerErrorMock = jest.spyOn(logger, 'error').mockImplementation(() => {});

            tuyaOpenMQ._on_message(user_data, payload);

            expect(tuyaOpenMQ._decode_mq_message).toHaveBeenCalledWith(msg_dict.data, user_data.password, msg_dict.t);
            expect(loggerErrorMock).toHaveBeenCalledWith('Failed to decode data from Tuya', 'tuya');
        });

        it('should log an error if data was not json', () => {
            const user_data = {
                password: 'password',
            };
            const payload = Buffer.from('encoded_payload', 'utf8');
            const loggerErrorMock = jest.spyOn(logger, 'error').mockImplementation(() => {});
            tuyaOpenMQ._on_message(user_data, payload);
            expect(loggerErrorMock).toHaveBeenCalledWith('Invalid JSON received from Tuya', 'tuya');
        });

    });

    describe('start', () => {
        it('should run MQTT connection and set up reconnect interval', () => {
            tuyaOpenMQ.__run_mqtt = jest.fn();
            tuyaOpenMQ.reconnect = jest.fn();

            jest.useFakeTimers();
            jest.spyOn(global, 'setInterval');

            tuyaOpenMQ.start();

            expect(tuyaOpenMQ.__run_mqtt).toHaveBeenCalled();
            expect(setInterval).toHaveBeenCalled();
            expect(tuyaOpenMQ.reconnect).toHaveBeenCalledTimes(0);
        
            // Advance timers to trigger the setInterval callback
            jest.advanceTimersByTime(600000);
            expect(tuyaOpenMQ.reconnect).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(600000);
            expect(tuyaOpenMQ.reconnect).toHaveBeenCalledTimes(2);
        
            // Clear the mocked setInterval
            jest.clearAllTimers();
        });
    });

    describe('stop', () => {
        it('should stop the client and set connected to false', () => {
            tuyaOpenMQ.client = {
                end: jest.fn(),
            };
            tuyaOpenMQ._connected = true;

            tuyaOpenMQ.stop();

            expect(tuyaOpenMQ.client.end).toHaveBeenCalled();
            expect(tuyaOpenMQ._connected).toBe(false);
        });
    });

    describe('__run_mqtt', () => {
        it('should fetch MQTT config and connect to MQTT server', async () => {
            const mq_config = {
                url: 'mqtt://example.com',
                client_id: 'client_id',
                username: 'username',
                password: 'password',
                source_topic: {
                    device: 'device_topic',
                },
            };
            tuyaOpenMQ._get_mqtt_config = jest.fn().mockResolvedValue(mq_config);
            tuyaOpenMQ._connect = jest.fn();

            await tuyaOpenMQ.__run_mqtt();

            expect(tuyaOpenMQ._get_mqtt_config).toHaveBeenCalled();
            expect(tuyaOpenMQ._connect).toHaveBeenCalledWith(mq_config);
            expect(tuyaOpenMQ.mq_config).toEqual(mq_config);
        });

        it('should log an error if failed to fetch MQTT config', async () => {
            tuyaOpenMQ._get_mqtt_config = jest.fn().mockResolvedValue(null);
            const loggerErrorMock = jest.spyOn(logger, 'error').mockImplementation(() => {});

            await tuyaOpenMQ.__run_mqtt();

            expect(tuyaOpenMQ._get_mqtt_config).toHaveBeenCalled();
            expect(loggerErrorMock).toHaveBeenCalledWith('Error while getting MQTT config', 'tuya');
            expect(tuyaOpenMQ.mq_config).toBeNull();
        });
    });

    describe('reconnect', () => {

        beforeEach(() => {
            tuyaOpenMQ._connected = true;
            tuyaOpenMQ._connecting = false;
            tuyaOpenMQ.stop = jest.fn();
            tuyaOpenMQ._get_mqtt_config = jest.fn().mockResolvedValue({
                url: 'mqtt://example.com',
                client_id: 'client_id',
                username: 'username',
                password: 'password',
                source_topic: {
                    device: 'device_topic',
                },
            });
            tuyaOpenMQ._mmqtConnect = jest.fn();

            tuyaOpenMQ.client = {
                options: {
                    clientId: 'client_id',
                    username: 'username',
                    password: 'password',
                },
                reconnect: jest.fn(),
            };
        })

        it('should cancel reconnect if already connected', async () => {
            const result = await tuyaOpenMQ.reconnect();
            expect(result).toBe(false);
            expect(tuyaOpenMQ.stop).toHaveBeenCalledTimes(0);
            expect(tuyaOpenMQ._get_mqtt_config).toHaveBeenCalledTimes(0);
            expect(tuyaOpenMQ._mmqtConnect).toHaveBeenCalledTimes(0);
            expect(logger.debug).toHaveBeenCalledWith('Cancelling reconnect, already connected', 'tuya')
        });

        it('should cancel reconnect if already connecting', async () => {
            tuyaOpenMQ._connected = false;
            tuyaOpenMQ._connecting = true;
            tuyaOpenMQ.reconnect();

            expect(tuyaOpenMQ._connecting).toBe(true);
            expect(tuyaOpenMQ.stop).toHaveBeenCalledTimes(0);
            expect(tuyaOpenMQ._get_mqtt_config).toHaveBeenCalledTimes(0);
            expect(tuyaOpenMQ._mmqtConnect).toHaveBeenCalledTimes(0);
            expect(logger.debug).toHaveBeenCalledWith('Cancelling reconnect, already connecting', 'tuya')
        });

        it('should restart the connection when forced', async () => {
            await tuyaOpenMQ.reconnect(true);

            expect(tuyaOpenMQ.stop).toHaveBeenCalled();
            expect(tuyaOpenMQ._connecting).toBe(true);
            expect(tuyaOpenMQ._get_mqtt_config).toHaveBeenCalled();
            expect(tuyaOpenMQ.client.reconnect).toHaveBeenCalled();
        });
    });

    describe('_mmqtConnect', () => {
        it('should connect to MQTT server and set up event listeners', () => {
            const mq_config = {
                url: 'mqtt://example.com',
                client_id: 'client_id',
                username: 'username',
                password: 'password',
                source_topic: {
                    device: 'device_topic',
                },
            };

            // Capture each event listener callback
            const clientCallbacks = {}
            const mqttOnMock = jest.fn().mockImplementation((event, callback) => {
                clientCallbacks[event] = callback;
            });

            // Mock the mqtt client
            const mqttSubscribeMock = jest.fn().mockImplementation((topic, callback) => {
                clientCallbacks.subscribe = callback;
            });

            const mqttClientMock = {
                on: mqttOnMock,
                subscribe: mqttSubscribeMock,
            };
            mqtt.connect = jest.fn().mockReturnValue(mqttClientMock);

            // Mock the logger for expect checking
            const loggerInfoMock = jest.spyOn(logger, 'info').mockImplementation(() => {});
            const loggerWarnMock = jest.spyOn(logger, 'warn').mockImplementation(() => {});
            const loggerErrorMock = jest.spyOn(logger, 'error').mockImplementation(() => {});

            // Call the method for testing
            const result = tuyaOpenMQ._connect(mq_config);

            // Basic checks
            expect(result).toBe(mqttClientMock);
            expect(mqtt.connect).toHaveBeenCalledWith(mq_config.url, {
                clientId: mq_config.client_id,
                username: mq_config.username,
                password: mq_config.password,
            });
            expect(mqttOnMock).toHaveBeenCalledWith('connect', expect.any(Function));
            expect(mqttOnMock).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mqttOnMock).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mqttOnMock).toHaveBeenCalledWith('close', expect.any(Function));

            // Simulate message
            tuyaOpenMQ._on_message = jest.fn();
            const messageListener = clientCallbacks['message'];
            const message = 'message';
            messageListener('topic', message);
            expect(tuyaOpenMQ._on_message).toHaveBeenCalledWith(mq_config, message);

            // Simulate error
            const errorListener = clientCallbacks['error'];
            const error = 'error';
            errorListener(error);
            expect(loggerErrorMock).toHaveBeenCalledWith(error, 'tuya');

            // Simulate close
            tuyaOpenMQ.reconnect = jest.fn();
            const closeListener = clientCallbacks['close'];
            closeListener();
            expect(tuyaOpenMQ._connected).toBe(false);
            expect(loggerWarnMock).toHaveBeenCalledWith('Connection to MQTT broker lost. Attempting to reconnect...', 'tuya');
            expect(tuyaOpenMQ.reconnect).toHaveBeenCalled();

            // Simulate connect
            const connectListener = clientCallbacks['connect'];
            connectListener();
            expect(loggerInfoMock).toHaveBeenCalledWith('Tuya MQTT Connected', 'tuya');
            expect(mqttSubscribeMock).toHaveBeenCalledWith(mq_config.source_topic.device, expect.any(Function));
        });
    });

    describe('add_message_listener', () => {
        it('should add a message listener', () => {
            const listener = jest.fn();

            tuyaOpenMQ.add_message_listener(listener);

            expect(tuyaOpenMQ.message_listeners.has(listener)).toBe(true);
        });
    });

    describe('remove_message_listener', () => {
        it('should remove a message listener', () => {
            const listener = jest.fn();
            tuyaOpenMQ.message_listeners.add(listener);

            tuyaOpenMQ.remove_message_listener(listener);

            expect(tuyaOpenMQ.message_listeners.has(listener)).toBe(false);
        });
    });
});