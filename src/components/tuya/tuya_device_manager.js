const logger = require('./../../logger');

/**
 * Manages Tuya device states and updates
 */
class TuyaDeviceManager {
    /**
     * @param {object} deviceComponent - FluentIoT device component
     * @param {object} eventComponent - FluentIoT event component
     */
    constructor(deviceComponent, eventComponent) {
        this.Device = deviceComponent;
        this.Event = eventComponent;
        this.devices = new Map();
    }

    /**
     * Handle device data updates
     * @param {object} data - Device data from Tuya
     */
    handleDeviceData(data) {
        const device = this.Device.findOne('attributes', { 'id': data.id });
        const deviceName = device?.name || 'Unknown';
        
        logger.debug(`Device "${deviceName}" (${data.id}) sent a payload: ${JSON.stringify(data.payload)}`, 'tuya device');

        if (!device) {
            logger.warn(`Received data for unknown device: ${data.id}`, 'tuya device');
            return false;
        }

        try {
            this._updateDeviceState(device, data.payload);
            return true;
        } catch (error) {
            logger.error(`Error updating device state: ${error.message}`, 'tuya device');
            return false;
        }
    }

    /**
     * Update device state
     * @private
     */
    _updateDeviceState(device, payload) {
        let value = payload.value;
        
        // Convert string booleans to actual booleans
        if (value === "true") { 
            value = true;
        } else if (value === "false") { 
            value = false;
        }

        device.attribute.update(payload.code, value);
        
        // Cache latest state
        if (!this.devices.has(device.id)) {
            this.devices.set(device.id, new Map());
        }
        this.devices.get(device.id).set(payload.code, value);
    }

    /**
     * Get cached device state
     * @param {string} deviceId - Device ID
     * @param {string} code - State code
     * @returns {*} Device state value
     */
    getDeviceState(deviceId, code) {
        return this.devices.get(deviceId)?.get(code);
    }
}

module.exports = TuyaDeviceManager;