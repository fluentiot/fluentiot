const Component = require('./../component')
const logger = require('./../../commons/logger')
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
        this.tuyaMqtt = null
    }

    /**
     * After Fluent is loaded setup connections
     */
    afterLoad() {
        this.Event = this.getComponent('event');
        this.Device = this.getComponent('device');

        this.Event.on('tuya.data', (passed) => {
            this.receivedData(passed);
        });
    }

    /**
     * Setup auth and MQTT connections to Tuya
     */
    async start() {
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
            this._send(); //Send anything in the queue
        }

        // Connect to Tuya
        await this.openApi.connect()

        // Setup MQTT
        this.tuyaMqtt = new TuyaMqtt(settings, this.openApi);
        this.tuyaMqtt.start();

        this.tuyaMqtt.add_message_listener((received) => {
            const data = JSON.parse(received.data);
            if(!data.status) { return false; }
            const id = data.devId;
            const payload = data.status[0];
            this.event().emit('tuya.data', { id, payload })
            return true
        });
    }

    /**
     * Receive data
     * 
     * @param {object} data - Decoded data received from device
     */
    receivedData(data) {
        const device = this.Device.findOne('attributes', { 'id': data.id });
        const deviceName = device?.name || 'Unknown';
        
        logger.debug(`Device "${deviceName}" (${data.id}) sent a payload: ${JSON.stringify(data.payload)}`,'tuya');

        if(!device) { return false }

        let value = data.payload.value;
        if(value === "true") { value = true; }
        else if(value === "false") { value = false; }
        device.attribute.update(data.payload.code, value);
        return true
    }

    /**
     * Send command to Tuya to control a device
     * 
     * @param {string} deviceId - Tuya device id
     * @param {object} command - Command to send to device
     * @param {object} options - Options for controlling version and URL
     */
    send(deviceId, command, options = {}) {
        // Version for Tuya API
        options.version = options.version || `v1.0`

        // URL
        if (options.version === 'v2.0' && !options.url) {
            options.url = `/${options.version}/cloud/thing/${deviceId}/shadow/properties/issue`
        } else if (options.version === 'v1.0' && !options.url) {
            options.url = `/${options.version}/devices/${deviceId}/commands`
        }
        
        this.queue.push({ id: deviceId, options, command })
    
        // If not processing then send
        if (!this.isProcessing) {
            this._send();
        }
    }

    /**
     * Send queue messages
     */
    async _send() {
        if(!this.connected) {
            return false;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            let { id, options, command } = this.queue.shift();

            // Format command
            let postData = this._formatCommands(options.version, command);

            // Send command
            try {
                this.openApi.post(options.url, postData);
                logger.debug(`Command sent to device ${id}: ${command}`,'tuya');
            } catch (error) {
                logger.error(`Error sending command to device "${id}": ${error.message}`,'tuya');
            }
        }

        this.isProcessing = false;
        return true
    }

    /**
     * Format commands for Tuya
     * 
     * @private
     * @param {string} version - Tuya version
     * @param {object} commands - Command to send to device
     * @returns 
     */
    _formatCommands(version, commands) {
        // Version 2
        if(version === 'v2.0') {
            return { properties: commands }
        }

        // Convert from key value to code, value object if needed
        if(!Array.isArray(commands) && !commands.code) {
            commands = Object.keys(commands).map((code) => {
                return { code, value: commands[code] };
            });
        }

        // Version 1
        if(!Array.isArray(commands)) { commands = [ commands ]; }
        return { commands }
    }


}

module.exports = TuyaComponent;
