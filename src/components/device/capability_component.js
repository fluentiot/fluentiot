const Component = require('./../component')
const Capability = require('./capability')
const logger = require('./../../logger')
const { validation } = require('./../../utils')

/**
 * Capability component
 *
 * @extends Component
 * @class
 */
class CapabilityComponent extends Component {

    /**
     * Constructor
     *
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent)
        this.capabilities = {}
    }

    /**
     * Creates a new capability
     *
     * @param {string} name - The name of the capability
     * @param {Function} callback - The callback function representing the capability's behavior.
     * @returns {Function} The added capability callback function.
     * @throws {Error} Throws an error if a capability with the same name already exists.
     */
    add(name, callback) {
        // Check if the capability already exists
        if (this.capabilities[name]) {
            throw new Error(`Capability with the name "${name}" already exists`)
        }

        // Ensure the callback is a function
        if (!callback || typeof callback !== 'function') {
            throw new Error(`Capability "${name}" requires a callback method`)
        }

        // Check if the name is valid
        if (!validation.isValidName(name)) {
            throw new Error(`Capability name "${name} is not valid`)
        }

        // Create a new capability
        const _capability = new Capability(this, name, callback)

        // Add the capability to the capabilities object
        this.capabilities[name] = (...args) => {
            try {
                const result = _capability.run(...args)
                // Check if the callback returned a promise
                if (result && typeof result.then === 'function') {
                    return result
                }
                // If not a promise, return the result directly
                return result
            } catch (err) {
                throw err
            }
        }

        return this.capabilities[name]
    }

    /**
     * Gets the capability with the specified name.
     *
     * @param {string} name - The name of the capability to get.
     * @returns {any|null} - Returns the capability.
     */
    get(name) {
        if (!this.capabilities[name]) {
            logger.error(`Capability "${name}" could not be found`, 'device')
            return null
        }
        return this.capabilities[name]
    }

}

module.exports = CapabilityComponent
