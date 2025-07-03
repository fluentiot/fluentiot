const { AttributeDslMixin } = require('./../_mixins/attribute_dsl')
const LoggingMixin = require('./../_mixins/logging_mixin')
const logger = require('./../../logger')

/**
 * Device
 *
 * @class
 */
class Device {
    
    /**
     * Represents a device in the system with specific attributes and capabilities.
     *
     * @param {object} parent - The parent object to which this device belongs.
     * @param {string} name - The name of the device.
     * @param {object} [attributes={}] - The attributes associated with the device.
     * @param {string[]} [capabilities=[]] - An array of capability references associated with the device.
     * @throws Will throw an error if capabilities are not passed as references (e.g., '@switchOn').
     */
    constructor(parent, name, attributes = {}, capabilities = []) {
        this.parent = parent
        this.name = name
        this.capabilities = {}

        // Mixins
        Object.assign(this, AttributeDslMixin(this, 'device'))
        Object.assign(this, LoggingMixin(this, 'device'))

        // Auto-log device creation
        logger.info(`Device "${name}" created`, 'device', this, { capabilities: capabilities.length })

        // Attributes
        const defaultAttributes = {
            stateful: true
        };
        this.attribute.setup(defaultAttributes, attributes)

        // Abstracting capability method so to reflect similar DSL in system
        // Instead of device.capability().add() => device.capability.add()
        this.capability = this._capability()

        // Add in capabilities
        for (let ii = 0; ii < capabilities.length; ii++) {
            if (!capabilities[ii].startsWith('@')) {
                throw new Error(`Capabilities must be passed as a reference (e.g. @switchOn)`)
            }
            this.capability.add(capabilities[ii])
        }
    }

    /**
     * Capability DSL
     *
     * @private
     */
    _capability() {
        return {
            add: (method, callback) => {
                if (typeof method === 'object') {
                    // Passed with an existing capability object
                    if (!method.callback || !method.name) {
                        throw new Error(`Invalid capability type, missing callback and name parameters`)
                    }

                    const _capability = method
                    callback = _capability.callback
                    method = _capability.name
                } else if (method.startsWith('@')) {
                    // Passed with just the name
                    if (callback) {
                        throw new Error(`When using a named capability do not define the method`)
                    }
                    const _callback = this.parent.getComponent('capability').get(method.substring(1))

                    if (!_callback) {
                        throw new Error(`Capability "${method}" does not exist`)
                    }

                    method = method.substring(1)
                    callback = _callback
                }

                // Capability with this name already exists
                if (this.capabilities[method]) {
                    throw new Error(`Cannot add capability "${name}" to ${this.name} as its added already`)
                }

                // Capabilities cannot have a space, otherwise they cannot be reliably called
                if (method.indexOf(' ') !== -1) {
                    throw new Error(`Capability cannot contain a space`)
                }

                this.capabilities[method] = callback

                this[method] = (...args) => {
                    // Auto-log capability execution
                    logger.info(`Device "${this.name}" capability ${method} executed`, 'device', this, { args: args.length });
                    try {
                        const result = callback(this, ...args);
                        logger.debug(`Device "${this.name}" capability ${method} completed successfully`, 'device', this);
                        return result;
                    } catch (error) {
                        logger.error(`Device "${this.name}" capability ${method} failed: ${error.message}`, 'device', this, { error: error.stack });
                        throw error;
                    }
                }

                return true
            },
        }
    }

    /**
     * Describe the device with its name and capabilities
     * 
     * @returns {object} Description object with name and capabilities
     */
    describe() {
        const description = {
            name: this.name,
            type: 'device',
            capabilities: Object.keys(this.capabilities),
            attributes: this.attributes,
            recentLogs: this.log.recent(5),
            logStats: this.log.stats
        }
        
        return description
    }
}

module.exports = Device
