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
            'device.capability': {
                handler: this.executeCapability.bind(this),
                description: 'Execute a specific capability on a device by name',
                parameters: [
                    { name: 'deviceId', type: 'string', required: true, description: 'The ID or name of the device' },
                    { name: 'capabilityName', type: 'string', required: true, description: 'The name of the capability to execute' },
                    { name: 'args', type: 'array', required: false, description: 'Optional arguments to pass to the capability' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'inspect device [name]',
            'execute [capability] on [device]',
            'device [name] [capability]',
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
                        capabilities: Object.keys(device.capabilities || {}),
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
            if (deviceComponent?.get) {
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

    executeCapability(params) {
        try {
            const { deviceId, capabilityName, args = [] } = params;
            const deviceComponent = this.getComponent('device');
            if (deviceComponent?.control) {
                const result = deviceComponent.control(deviceId, capabilityName, ...args);
                this.logSuccess(`Executed capability "${capabilityName}" on device "${deviceId}"`);
                return result;
            }
            return { error: 'Device capability execution not available' };
        } catch (error) {
            return this.handleError('executing device capability', error);
        }
    }
}

module.exports = DeviceCommands;
