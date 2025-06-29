const Device = require('./device')
const Component = require('./../component')
const Expect = require('./../../utils/expect')
const logger = require('./../../logger')
const { validation } = require('./../../utils')
const { QueryDslMixin } = require('./../_mixins/query_dsl')

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
        super(Fluent)
        this.devices = {}

        // Mixins
        Object.assign(this, QueryDslMixin(this, this.devices))
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
            throw new Error(`Device with the name "${name}" already exists`)
        }
        if (!validation.isValidName(name)) {
            throw new Error(`Device name "${name} is not valid`);
        }
        this.devices[name] = new Device(this, name, attributes, capabilities)
        return this.devices[name]
    }

    /**
     * Gets the device with the specified name.
     *
     * @param {string} name - The name of the device to get.
     * @returns {any|null} - Returns the device.
     */
    get(name) {
        if (!this.devices[name]) {
            logger.error(`Device "${name}" could not be found`, 'device')
            return null
        }
        return this.devices[name]
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
                const device = this.get(name)
                if (!device) {
                    throw new Error(`Device "${name}" does not exist`)
                }

                return {
                    is: (attributeName) => {
                        this._match('is', scope, device, attributeName, true)
                        return scope
                    },
                    isNot: (attributeName) => {
                        this._match('isNot', scope, device, attributeName, true)
                        return scope
                    },
                    attribute: (attributeName) => {
                        return {
                            is: (attributeValue) => {
                                this._match('is', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            isNot: (attributeValue) => {
                                this._match('isNot', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            isGreaterThan: (attributeValue) => {
                                this._match('isGreaterThan', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            isGreaterThanOrEqual: (attributeValue) => {
                                this._match('isGreaterThanOrEqual', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            isLessThan: (attributeValue) => {
                                this._match('isLessThan', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            isLessThanOrEqual: (attributeValue) => {
                                this._match('isLessThanOrEqual', scope, device, attributeName, attributeValue)
                                return scope
                            },
                            changes: () => {
                                this._match('any', scope, device, attributeName)
                                return scope
                            },
                        }
                    },
                }
            },
        }
    }

    /**
     * Defines constraints related to device.
     *
     * @returns {object} - An object with constraint methods
     */
    constraints() {
        return {
            device: (name) => {
                const device = this.get(name)
                if (!device) {
                    throw new Error(`Device "${name}" does not exist`, 'device')
                }
                
                return {
                    attribute: (attributeName) => {
                        return new Expect(() => device.attribute.get(attributeName))
                    }
                }
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
    _match(operator, Scenario, device, attributeName, attributeValue) {
        const handler = (changedData) => {
            if (changedData.name !== attributeName) {
                return
            }

            // If device is stateful and value has not changed then return
            // A button, it's not stateful and can be pressed multiple times
            // A switch, it is stateful, and each time it's pressed the state changes
            if(device.attribute.get('stateful') === true && changedData.changed === false) {
                return
            }

            // Call Expect methods
            let assert = false
            const expect = new Expect(changedData.value)

            switch(operator) {
                case 'any':
                    assert = true
                    break
                case 'is':
                    assert = expect.is(attributeValue)
                    break
                case 'isNot':
                    assert = expect.not.is(attributeValue)
                    break
                case 'isGreaterThan':
                    assert = expect.isGreaterThan(attributeValue)
                    break
                case 'isGreaterThanOrEqual':
                    assert = expect.isGreaterThanOrEqual(attributeValue)
                    break
                case 'isLessThan':
                    assert = expect.isLessThan(attributeValue)
                    break
                case 'isLessThanOrEqual':
                    assert = expect.isLessThanOrEqual(attributeValue)
                    break
            }

            if (assert) {
                Scenario.assert(device)
            }
        }

        this.event().on(`device.${device.name}.attribute`, handler)
    }

    /**
     * Control a device by executing one of its capabilities
     *
     * @param {string} deviceName - The name of the device to control
     * @param {string} capabilityName - The name of the capability to execute
     * @param {...any} args - Additional arguments to pass to the capability
     * @returns {any} The result of the capability execution
     */
    control(deviceName, capabilityName, ...args) {
        const device = this.get(deviceName);
        if (!device) {
            throw new Error(`Device "${deviceName}" not found`);
        }

        // Check if the capability exists on the device
        if (!device.capabilities[capabilityName]) {
            const availableCapabilities = Object.keys(device.capabilities);
            throw new Error(`Capability "${capabilityName}" not found on device "${deviceName}". Available capabilities: ${availableCapabilities.join(', ')}`);
        }

        // Execute the capability
        logger.info(`Executing capability "${capabilityName}" on device "${deviceName}"`, 'device');
        
        try {
            const result = device[capabilityName](...args);
            logger.info(`Successfully executed capability "${capabilityName}" on device "${deviceName}"`, 'device');
            return { 
                success: true, 
                device: deviceName, 
                capability: capabilityName, 
                result: result 
            };
        } catch (error) {
            logger.error(`Failed to execute capability "${capabilityName}" on device "${deviceName}": ${error.message}`, 'device');
            throw error;
        }
    }

    /**
     * Execute a capability on a device by name (alias for control)
     *
     * @param {string} deviceName - The name of the device
     * @param {string} capabilityName - The name of the capability to execute
     * @param {...any} args - Additional arguments to pass to the capability
     * @returns {any} The result of the capability execution
     */
    executeCapability(deviceName, capabilityName, ...args) {
        return this.control(deviceName, capabilityName, ...args);
    }
}

module.exports = DeviceComponent
