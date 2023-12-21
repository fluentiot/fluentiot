const Component = require('./../component')
const logger = require('./../../utils/logger')
const config = require('./../../config')

const TuyaMqtt = require('./tuya_mqtt');
const TuyaOpenApi = require('./tuya_openapi');

/**
 * Tuya component
 *
 * @extends Component
 * @class
 */
class TuyaComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);

        this.queue = [];
        this.isProcessing = false;

        this.connected = false;
        this.openApi = null;
    }

    /**
     * After Fluent is loaded setup connections
     */
    afterLoad() {
        this.Event = this.Fluent.component().get('event');
        this.Device = this.Fluent.component().get('device');

        this.setup();

        this.Event.on('tuya.data', (passed) => {
            this.receivedData(passed);
        });
    }

    /**
     * Setup auth and MQTT connections to Tuya
     */
    setup() {
        const settings = {
            auth_type: 'smart',
            hostname: config.get('tuya.base_url'),
            token_info: config.get('tuya')
        };

        this.openApi = new TuyaOpenApi(
            settings.hostname, 
            settings.token_info.access_key, 
            settings.token_info.secret_key,
            settings.token_info.username,
            settings.token_info.password
        );

        this.openApi.onConnect = () => {
            this.connected = true;
            this.event().emit('tuya.connected');

            //Send anything in the queue
            this._send();
        }

        let tuya = new TuyaMqtt(settings, this.openApi);
        tuya.start();

        tuya.add_message_listener((received) => {
            const data = JSON.parse(received.data);
            if(!data.status) { return; }
            const id = data.devId;
            const payload = data.status[0];
            this.event().emit('tuya.data', { id, payload })
        });
    }

    /**
     * Receive data
     * 
     * @param {object} data - Decoded data received from device
     */
    receivedData(data) {
        const device = this.Device.findOne({ 'id': data.id });
        const deviceName = device?.name || 'Unknown';
        
        logger.debug(`Device "${deviceName}" (${data.id}) sent a payload: ${JSON.stringify(data.payload)}`,'tuya');

        if(device) {
            let value = data.payload.value;
            if(value === "true") { value = true; }
            else if(value === "false") { value = false; }
            device.attribute.update(data.payload.code, value);
        }
    }

    /**
     * Send command to Tuya to control a device
     * 
     * @param {string} deviceId - Tuya device id
     * @param {object} command - Command to send to device
     * @param {object} options - Options for controlling version and URL
     */
    send(deviceId, command, options = {}) {
        options.version = options.version || `v1.0`;
        options.url = options.url || `/${options.version}/devices/${deviceId}/commands`;
        
        this.queue.push({ id: deviceId, options, command });
    
        if (!this.isProcessing) {
            this._send();
        }
    }

    /**
     * Send queue messages
     */
    async _send() {
        if(!this.connected) {
            return;
        }

        this.isProcessing = true;
        while (this.queue.length > 0) {
            let { id, options, command } = this.queue.shift();
            try {
                //Url
                const url = options.url;

                //Command can be an array of multiple commands, if it's not then make it an array
                let postData;
                if(options.version === 'v1.0') {
                    if(!Array.isArray(command)) { command = [ command ]; }
                    postData = { commands: command };
                }
                else {
                    postData = { properties: command };
                }

                this.openApi.post(url, postData);

                logger.debug(`Command sent to device ${id}: ${command}`,'tuya');
            } catch (error) {
                logger.error(`Error sending command to device ${id}: ${error.message}`,'tuya');
            }
        }
        this.isProcessing = false;
    }
}

module.exports = TuyaComponent;
