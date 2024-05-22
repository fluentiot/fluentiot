
jest.mock('./../../../src/commons/logger')
const logger = require('./../../../src/commons/logger')

jest.mock('./../../../src/config')
const config = require('./../../../src/config')

jest.mock('./../../../src/components/tuya/tuya_mqtt')
const TuyaMqtt = require('./../../../src/components/tuya/tuya_mqtt');

jest.mock('./../../../src/components/tuya/tuya_openapi')
const TuyaOpenApi = require('./../../../src/components/tuya/tuya_openapi');

const TuyaComponent = require('./../../../src/components/tuya/tuya_component');

describe('TuyaComponent', () => {
    let tuyaComponent;

    beforeEach(() => {
        tuyaComponent = new TuyaComponent();
        tuyaComponent.Device = {
            findOne: jest.fn().mockReturnValue({
                name: 'Test Device',
                attribute: {
                    update: jest.fn()
                }
            })
        };

        tuyaComponent.openApi = {
            post: jest.fn(),
            onConnect: jest.fn()
        };

        tuyaComponent.getComponent = jest.fn().mockReturnValue({
            emit: jest.fn(),
            on: jest.fn()
        })

        // Mock config
        config.get = jest.fn().mockImplementation((key) => {
            if (key === 'tuya.base_url') { return 'example.com'; }
            else if (key === 'tuya') {
                return {
                    access_key: 'accessKey',
                    secret_key: 'secretKey',
                    username: 'username',
                    password: 'password'
                }
            }
        });

        // Mock TuyaOpenApi
        TuyaOpenApi.mockImplementation(() => {
            return {
                post: jest.fn(),
                onConnect: jest.fn(),
                connect: jest.fn()
            }
        });
    });

    it('sets up correctly', () => {
        expect(tuyaComponent.connected).toBe(false);
        expect(tuyaComponent.queue).toEqual([]);
        expect(tuyaComponent.isProcessing).toBe(false);
    })

    it('afterLoad loads the devices', () => {
        tuyaComponent.afterLoad();

        expect(tuyaComponent.getComponent).toHaveBeenCalledWith('event');
        expect(tuyaComponent.getComponent).toHaveBeenCalledWith('device');
    })

    it('setup sets up the open api', async () => {
        await tuyaComponent.start();

        // Open API should have been created
        expect(TuyaOpenApi).toHaveBeenCalledWith(
            'example.com',
            'accessKey',
            'secretKey',
            'username',
            'password'
        );

        // MQTT should have been created
        const expectedSettings = {
            auth_type: 'smart',
            hostname: 'example.com',
            token_info: {
                access_key: 'accessKey',
                secret_key: 'secretKey',
                username: 'username',
                password: 'password'
            }
        };
        expect(TuyaMqtt).toHaveBeenCalledWith(expectedSettings, tuyaComponent.openApi)


        // Mock tuyaComponent._send to make sure it was called
        tuyaComponent._send = jest.fn();

        //Call the onConnect function
        expect(tuyaComponent.connected).toBe(false);
        tuyaComponent.openApi.onConnect()
        expect(tuyaComponent.connected).toBe(true);
        expect(tuyaComponent.getComponent('event').emit).toHaveBeenCalledWith('tuya.connected');
        expect(tuyaComponent._send).toHaveBeenCalled()

        expect(tuyaComponent.openApi).not.toBeNull();
        expect(tuyaComponent.tuyaMqtt.start).toHaveBeenCalled();
    })

    it('receives data from mqtt event is emitted', async () => {
        let messageListenerCallback;
        TuyaMqtt.mockImplementation(() => {
            return {
                start: jest.fn(),
                add_message_listener: jest.fn().mockImplementation((callback) => {
                    messageListenerCallback = callback;
                })
            }
        });

        // Example of data from Tuya Mqtt
        const data = {
            devId: 456,
            status: [
                {
                    id: '123',
                    code: 'power',
                    value: 'true'
                }
            ]
        };
        await tuyaComponent.start();

        // call this.tuyaMqtt.add_message_listener
        const success = messageListenerCallback({ data: JSON.stringify(data) });
        expect(success).toBe(true)

        // check tuya.data event was emitted
        expect(tuyaComponent.getComponent('event').emit).toHaveBeenCalledWith('tuya.data', { id: data.devId, payload: data.status[0] });
    })

    it('receivedData should update device attribute when received data', () => {
        const data = {
            id: '123',
            payload: {
                code: 'power',
                value: 'true'
            }
        };

        const result = tuyaComponent.receivedData(data);

        expect(result).toBe(true);
        expect(tuyaComponent.Device.findOne).toHaveBeenCalledWith('attributes', { 'id': data.id });
        expect(tuyaComponent.Device.findOne).toHaveBeenCalledTimes(1);
        expect(tuyaComponent.Device.findOne().name).toBe('Test Device');
        expect(tuyaComponent.Device.findOne().attribute.update).toHaveBeenCalledWith(data.payload.code, true);
        expect(tuyaComponent.Device.findOne().attribute.update).toHaveBeenCalledTimes(1);
    });

    it('receivedData should handle unknown device', () => {
        tuyaComponent.Device = {
            findOne: jest.fn().mockReturnValue(false)
        };

        const data = {
            id: '456',
            payload: {
                code: 'power',
                value: 'true'
            }
        };

        const result = tuyaComponent.receivedData(data);

        expect(result).toBe(false);
    });

    it('should handle false value', () => {
        const data = {
            id: '123',
            payload: {
                code: 'power',
                value: 'false'
            }
        };

        const result = tuyaComponent.receivedData(data);

        expect(result).toBe(true)
        expect(tuyaComponent.Device.findOne).toHaveBeenCalledWith('attributes', { 'id': data.id });
        expect(tuyaComponent.Device.findOne).toHaveBeenCalledTimes(1);
        expect(tuyaComponent.Device.findOne().name).toBe('Test Device');
        expect(tuyaComponent.Device.findOne().attribute.update).toHaveBeenCalledWith(data.payload.code, false);
        expect(tuyaComponent.Device.findOne().attribute.update).toHaveBeenCalledTimes(1);
    });

    it('should add command to the queue when send is called', () => {
        const deviceId = '123';
        const command = { code: 'power', value: 'true' };
        const options = { version: 'v1.0', url: '/v1.0/devices/123/commands' };

        tuyaComponent.send(deviceId, command, options);

        expect(tuyaComponent.queue).toHaveLength(1);
        expect(tuyaComponent.queue[0]).toEqual({ id: deviceId, options, command });
    });

    it('should add command to the queue with default options', () => {
        const deviceId = '123';
        const command = { code: 'power', value: 'true' };
        const options = { version: 'v2.0' };

        tuyaComponent.send(deviceId, command, options);

        const expectedOptions = { version: 'v2.0', url: '/v2.0/cloud/thing/123/shadow/properties/issue' }

        expect(tuyaComponent.queue).toHaveLength(1);
        expect(tuyaComponent.queue[0]).toEqual({ id: deviceId, options: expectedOptions, command });
    });

    it('wont process the message if sending queue message already', () => {
        const deviceId = '123'
        const command = { code: 'power', value: 'true' }

        tuyaComponent._send = jest.fn()

        tuyaComponent.isProcessing = true
        tuyaComponent.send(deviceId, command)

        tuyaComponent.isProcessing = false
        tuyaComponent.send(deviceId, command)
        tuyaComponent.send(deviceId, command)

        expect(tuyaComponent._send).toHaveBeenCalledTimes(2)
    });

    it('should process the queue when _send is called', async () => {
        const deviceId = '123';
        const command = { code: 'power', value: 'true' };
        const options = { version: 'v1.0', url: '/v1.0/devices/123/commands' };
        tuyaComponent.queue = [{ id: deviceId, options, command }];

        tuyaComponent.connected = true
        await tuyaComponent._send();

        expect(tuyaComponent.openApi.post).toHaveBeenCalledWith(options.url, { commands: [command] });
        expect(tuyaComponent.openApi.post).toHaveBeenCalledTimes(1);
        expect(tuyaComponent.isProcessing).toBe(false);
    });

    it('should handle openApi throwing an error', async () => {
        const deviceId = '123';
        const command = { code: 'power', value: 'true' };
        const options = { version: 'v1.0', url: '/v1.0/devices/123/commands' };
        tuyaComponent.queue = [{ id: deviceId, options, command }];

        // Mock openApi.post to throw an error
        tuyaComponent.openApi.post = jest.fn().mockImplementation(() => {
            throw new Error('Error sending command');
        });

        tuyaComponent.connected = true
        await tuyaComponent._send();

        expect(logger.error).toHaveBeenCalledWith('Error sending command to device "123": Error sending command', 'tuya');
    })

    it('should handle v2 api', async () => {
        const deviceId = '123';
        const command = { code: 'power', value: 'true' };
        const options = { version: 'v2.0', url: '/v2.0/cloud/thing/123/shadow/properties/issue' };
        tuyaComponent.queue = [{ id: deviceId, options, command }];

        tuyaComponent.connected = true
        await tuyaComponent._send();

        expect(tuyaComponent.openApi.post).toHaveBeenCalledWith(options.url, { properties: command });
        expect(tuyaComponent.openApi.post).toHaveBeenCalledTimes(1);
        expect(tuyaComponent.isProcessing).toBe(false);
    });

    it('should not process the queue if not connected', async () => {
        tuyaComponent.connected = false;
        tuyaComponent.queue = [{ id: '123', options: {}, command: {} }];

        await tuyaComponent._send();

        expect(tuyaComponent.openApi.post).not.toHaveBeenCalled();
        expect(tuyaComponent.isProcessing).toBe(false);
    })

    it('can send a message to the queue and it will post it', () => {
        tuyaComponent.connected = true

        const deviceId = '123'
        const command = { code: 'power', value: 'true' }
        tuyaComponent.send(deviceId, command)

        const expectedUrl = '/v1.0/devices/123/commands'

        expect(tuyaComponent.openApi.post).toHaveBeenCalledWith(expectedUrl, { commands: [command] });
        expect(tuyaComponent.openApi.post).toHaveBeenCalledTimes(1);
    })

    it('can handle multiple commands', () => {
        tuyaComponent.connected = true

        const deviceId = '123'
        const command = [
            { code: 'power', value: 'true' },
            { code: 'switch', value: 'on' }
        ]
        tuyaComponent.send(deviceId, command)

        const expectedUrl = '/v1.0/devices/123/commands'

        expect(tuyaComponent.openApi.post).toHaveBeenCalledWith(expectedUrl, { commands: command });
        expect(tuyaComponent.openApi.post).toHaveBeenCalledTimes(1);
    })

    it('can handle commands sent as key value', () => {
        tuyaComponent.connected = true

        const deviceId = '123'
        const command = {
            power: 'true',
            switch: 'on'
        }
        tuyaComponent.send(deviceId, command)

        const expectedUrl = '/v1.0/devices/123/commands'
        const expectedCommand = [
            { code: 'power', value: 'true' },
            { code: 'switch', value: 'on' }
        ]

        expect(tuyaComponent.openApi.post).toHaveBeenCalledWith(expectedUrl, { commands: expectedCommand });
        expect(tuyaComponent.openApi.post).toHaveBeenCalledTimes(1);
    })

});