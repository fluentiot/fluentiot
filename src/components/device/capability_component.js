const Component = require('./../component');
const logger = require('./../../utils/logger');

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
        super(Fluent);
        this.capabilities = {};
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
            throw new Error(`Capability with the name "${name}" already exists`);
        }
        if (!callback) {
            throw new Error(`Capability "${name}" requires a callback method`);
        }
        if (!this._validateMethodName(name)) {
            throw new Error(`Capability "${name}" is not a valid name. Spaces and reserved nodejs names are not permitted.`);
        }

        this.capabilities[name] = callback;
        return this.capabilities[name];
    }

    /**
     * Gets the capability with the specified name.
     *
     * @param {string} name - The name of the capability to get.
     * @returns {any|null} - Returns the capability.
     */
    get(name) {
        if (!this.capabilities[name]) {
            logger.error(`Capability "${name}" could not be found`, 'device');
            return null;
        }
        return this.capabilities[name];
    }

    /**
     * Validates if a string can be used as a method name.
     * 
     * @private
     * @param {string} methodName - The string to validate as a method name.
     * @return {boolean} - If the name is valid to be used as a method
     */
    _validateMethodName(methodName) {
        // No name
        if(!methodName) {
            return false;
        }

        // Check for spaces in the method name
        if (/\s/.test(methodName)) {
            return false;
        }
    
        // Check if the method name is a reserved word
        const reservedWords = ['constructor', 'prototype'];
        if (reservedWords.includes(methodName)) {
            return false;
        }

        return true;
    }

}

module.exports = CapabilityComponent;
