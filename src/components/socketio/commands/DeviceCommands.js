const BaseCommand = require('./BaseCommand');

/**
 * Device commands
 */
class DeviceCommands extends BaseCommand {
    getCommands() {
        return {
            'device.list': this.listDevices.bind(this),
            'device.get': this.getDevice.bind(this),
            'device.control': this.controlDevice.bind(this)
        };
    }

    getCommandSuggestions() {
        return [
            'inspect device [name]',
            'turn on [device]',
            'turn off [device]'
        ];
    }

    listDevices(params) {
        try {
            const deviceComponent = this.Fluent._component().get('device');
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
            const deviceComponent = this.Fluent._component().get('device');
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
            const deviceComponent = this.Fluent._component().get('device');
            if (deviceComponent && deviceComponent.control) {
                return deviceComponent.control(deviceId, action, value);
            }
            return { message: 'Device control not available' };
        } catch (error) {
            return this.handleError('controlling device', error);
        }
    }
}

module.exports = DeviceCommands;
