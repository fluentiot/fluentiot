const Component = require('./../component')
const Capability = require('./capability')
const logger = require('./../../commons/logger')
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
        if (this.capabilities[name]) {
            throw new Error(`Capability with the name "${name}" already exists`)
        }
        if (!callback) {
            throw new Error(`Capability "${name}" requires a callback method`)
        }
        if (!validation.isValidName(name)) {
            throw new Error(`Capability name "${name} is not valid`)
        }

        const _capability = new Capability(this, name, callback)

        this.capabilities[name] = async (...args) => {
            return await _capability.run(...args)
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
