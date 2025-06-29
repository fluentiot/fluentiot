const Command = require('../command');

/**
 * Device-related commands for controlling and inspecting IoT devices
 */
class DeviceCommands extends Command {
    
    getComponentName() {
        return 'device';
    }

    getCommands() {
        return {
            'device.list': {
                handler: this.listDevices.bind(this),
                description: 'List all available devices in the system with their current status and capabilities',
                parameters: []
            },
            'device.get': {
                handler: this.getDevice.bind(this),
                description: 'Get detailed information about a specific device including attributes and capabilities',
                parameters: [
                    { name: 'deviceId', type: 'string', required: true, description: 'The ID or name of the device' },
                    { name: 'action', type: 'string', required: false, description: 'Optional action like "describe" for detailed info' }
                ]
            },
            'device.control': {
                handler: this.controlDevice.bind(this),
                description: 'Control a device by executing an action with optional parameters',
                parameters: [
                    { name: 'deviceId', type: 'string', required: true, description: 'The ID or name of the device to control' },
                    { name: 'action', type: 'string', required: true, description: 'The action to perform (e.g., "on", "off", "dim")' },
                    { name: 'value', type: 'any', required: false, description: 'Optional value for the action (e.g., brightness level)' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'inspect device [name]',
            'turn on [device]',
            'turn off [device]',
            'dim [device] to [percentage]',
            'list all devices'
        ];
    }

    listDevices(params) {
        try {
            const deviceComponent = this.getComponent('device');
            if (deviceComponent) {
                const devices = deviceComponent.devices || {};
                const deviceCount = Object.keys(devices).length;
                this.logSuccess(`Device component found, devices count: ${deviceCount}`);
                
                // Create a safe, serializable version of the devices
                const safeDevices = {};
                Object.keys(devices).forEach(deviceName => {
                    const device = devices[deviceName];
                    safeDevices[deviceName] = {
                        name: device.name || deviceName,
                        attributes: device.attributes || {},
                        capabilities: Array.isArray(device.capabilities) ? device.capabilities : [],
                        type: device.type || 'unknown'
                    };
                });
                
                this.logSuccess(`Returning ${Object.keys(safeDevices).length} safe devices`);
                return safeDevices;
            }
            this.logSuccess('Device component not available');
            return {};
        } catch (error) {
            return this.handleError('listing devices', error);
        }
    }

    getDevice(params) {
        try {
            const { deviceId, action } = params;
            const deviceComponent = this.getComponent('device');
            if (deviceComponent && deviceComponent.get) {
                const device = deviceComponent.get(deviceId);
                if (!device) {
                    return { error: `Device "${deviceId}" not found` };
                }
                
                // If action is 'describe', use the describe method
                if (action === 'describe' && typeof device.describe === 'function') {
                    return device.describe();
                }
                
                // Return basic device info without circular references
                return {
                    name: device.name || deviceId,
                    attributes: device.attributes || {},
                    capabilities: Object.keys(device.capabilities || {}),
                    type: 'device'
                };
            }
            return { message: 'Device component not available' };
        } catch (error) {
            return this.handleError('getting device', error);
        }
    }

    controlDevice(params) {
        try {
            const { deviceId, action, value } = params;
            const deviceComponent = this.getComponent('device');
            if (deviceComponent && deviceComponent.control) {
                const result = deviceComponent.control(deviceId, action, value);
                this.logSuccess(`Device "${deviceId}" controlled with action "${action}"`);
                return result;
            }
            return { message: 'Device control not available' };
        } catch (error) {
            return this.handleError('controlling device', error);
        }
    }
}

module.exports = DeviceCommands;
