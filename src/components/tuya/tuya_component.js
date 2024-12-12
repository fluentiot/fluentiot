const Component = require('./../component')
const logger = require('./../../commons/logger')
const config = require('./../../config')

const TuyaConnectionManager = require('./tuya_connection_manager');
const TuyaDeviceManager = require('./tuya_device_manager');
const TuyaQueue = require('./tuya_queue');

/**
 * Tuya component - Main entry point for Tuya integration
 * Acts as coordinator between FluentIoT and Tuya services
 *
 * @extends Component
 * @class
 */
class TuyaComponent extends Component {
    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework
     */
    constructor(Fluent) {
        super(Fluent);
        
        // Initialize managers with lazy loading
        this.connectionManager = null;
        this.deviceManager = null;
        this.queue = null;
    }

    /**
     * After Fluent is loaded setup connections
     */
    afterLoad() {
        // Get required Fluent components
        this.Event = this.getComponent('event');
        this.Device = this.getComponent('device');

        // Initialize managers
        const settings = this._getSettings();
        
        this.deviceManager = new TuyaDeviceManager(this.Device, this.Event);
        this.queue = new TuyaQueue();
        this.connectionManager = new TuyaConnectionManager(settings, {
            onConnected: () => this.queue.process(),
            onDeviceData: (data) => this.deviceManager.handleDeviceData(data)
        });

        // Setup event listeners
        this.Event.on('tuya.data', (data) => this.deviceManager.handleDeviceData(data));
    }

    /**
     * Start the Tuya integration
     */
    async start() {
        try {
            await this.connectionManager.start();
            logger.info('Tuya component started successfully', 'tuya');
        } catch (error) {
            logger.error(`Failed to start Tuya component: ${error.message}`, 'tuya');
            throw error;
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
        // Add defaults to options
        options.version = options.version || 'v1.0';
        options.url = options.url || this._getCommandUrl(deviceId, options.version);

        // Add to queue
        this.queue.add({
            id: deviceId,
            options,
            command,
            send: async (cmd) => {
                await this.connectionManager.sendCommand(cmd);
                logger.debug(`Command sent to device ${deviceId}: ${JSON.stringify(command)}`, 'tuya');
            }
        });
    }

    /**
     * Get settings from config
     * 
     * @private
     * @returns {object} Settings object
     */
    _getSettings() {
        return {
            auth_type: 'smart',
            hostname: config.get('tuya.base_url'),
            token_info: config.get('tuya')
        };
    }

    /**
     * Get command URL based on version
     * 
     * @private
     * @param {string} deviceId - Device ID
     * @param {string} version - API version
     * @returns {string} Command URL
     */
    _getCommandUrl(deviceId, version) {
        if (version === 'v2.0') {
            return `/v2.0/cloud/thing/${deviceId}/shadow/properties/issue`;
        }
        return `/v1.0/devices/${deviceId}/commands`;
    }
}

module.exports = TuyaComponent;