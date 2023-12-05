const Device = require('./device');
const Component = require('./../component');
const logger = require('./../../utils/logger');

/**
 * Device component
 *
 * @extends Component
 * @class
 */
class DeviceComponent extends Component {
    
    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.devices = {};
    }

    /**
     * Creates a new device
     *
     * @param {string} name - The name of the device.
     * @param {object} [attributes={}] - Attributes for the device.
     * @param {array} [capabilities=[]] - Capabilities the device will have, must be passed as @ reference.
     */
    add(name, attributes = {}, capabilities = []) {
        if (this.devices[name]) {
            throw new Error(`Device with the name "${name}" already exists`);
        }
        this.devices[name] = new Device(this, name, attributes, capabilities);
        return this.devices[name];
    }

    /**
     * Gets the device with the specified name.
     *
     * @param {string} name - The name of the device to get.
     * @returns {any|null} - Returns the device.
     */
    get(name) {
        if (!this.devices[name]) {
            logger.error(`Device "${name}" could not be found`, 'device');
            return null;
        }
        return this.devices[name];
    }

    /**
     * Finds individual device by attribute
     *
     * @param {string} attribute - The attribute to search for.
     * @param {*} value - The value to match for the specified attribute.
     * @returns {object<Device>|null} - An array of devices matching the attribute and value,
     *   or null if no matching devices are found.
     */
    findByAttribute(attribute, value) {
        const results = this.findAllByAttribute(attribute, value);
        return results ? results[0] : null;
    }

    /**
     * Finds devices with a specified attribute and value.
     *
     * @param {string} attribute - The attribute to search for.
     * @param {*} value - The value to match for the specified attribute.
     * @returns {Array<Device>|null} - An array of devices matching the attribute and value,
     *   or null if no matching devices are found.
     */
    findAllByAttribute(attribute, value) {
        const results = Object.values(this.devices)
            .filter(device => device.attribute.get(attribute) === value);
        return results.length ? results : null;
    }

    /**
     * Defines triggers related to devices for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(scope) {
        return {
            device: (name) => {
                const device = this.get(name);
                if (!device) {
                    throw new Error(`Device "${name}" does not exist`);
                }

                return {
                    is: (attributeName) => {
                        this._is(scope, device, attributeName, true);
                        return scope;
                    },
                    isNot: (attributeName) => { 
                        this._is(scope, device, attributeName, false);
                        return scope;
                    },
                    attribute: (attributeName) => {
                        return {
                            is: (attributeValue) => {
                                this._is(scope, device, attributeName, attributeValue);
                                return scope;
                            },
                            isNot: (attributeValue) => {
                                this._is(scope, device, attributeName, attributeValue, 'not');
                                return scope;
                            },
                            changes: () => {
                                this._is(scope, device, attributeName, null, 'any');
                                return scope;
                            }
                        }
                    }
                };
            },
        }
    }

    /**
     * Check if a device's attribute meets a specified condition and trigger a scenario assertion accordingly.
     *
     * @private
     * @param {Scenario} Scenario - The scenario instance to trigger the assertion.
     * @param {device} device - The device to monitor for attribute changes.
     * @param {string} attributeName - The name of the attribute to check.
     * @param {any} attributeValue - The expected value of the attribute.
     * @param {string} [operator='is'] - The comparison operator ('is', 'not', 'any').
     *   - 'is': The attribute value must be equal to the specified value.
     *   - 'not': The attribute value must not be equal to the specified value.
     *   - 'any': Trigger the scenario assertion for any attribute change.
     */
    _is(Scenario, device, attributeName, attributeValue, operator = 'is') {
        const handler = (changedData) => {
            if (changedData.name !== attributeName) {
                return;
            }

            if (
                (operator === 'is' && changedData.value === attributeValue) ||
                (operator === 'not' && changedData.value !== attributeValue) ||
                (operator === 'any')
            ) {
                Scenario.assert(device);
            }
        };

        this.event().on(`device.${device.name}`, handler);
    }

}

module.exports = DeviceComponent;
