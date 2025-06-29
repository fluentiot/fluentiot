const logger = require('../logger');

/**
 * Represents an abstract base class for commands that can be executed within components.
 * Commands provide a standardized way to expose component functionality through various interfaces
 * including CLI, API, and future LLM integration.
 *
 * @abstract
 * @class
 */
class Command {

    /**
     * Creates a new Command instance. This constructor should not be called directly.
     * 
     * @constructor
     * @param {Fluent} Fluent - The Fluent instance to be used by the command.
     * @throws {Error} If instantiated directly.
     */
    constructor(Fluent) {
        if (new.target === Command) {
            throw new Error('Cannot instantiate abstract class Command.')
        }

        this.Fluent = Fluent;
    }

    /**
     * Get the command definitions for this command group.
     * Must be implemented by subclasses.
     * 
     * @abstract
     * @returns {Object} Object with command definitions where keys are command names
     *                   and values are objects with handler, description, and parameters
     * @example
     * {
     *   'device.list': {
     *     handler: this.listDevices.bind(this),
     *     description: 'List all available devices in the system',
     *     parameters: []
     *   }
     * }
     */
    getCommands() {
        throw new Error('getCommands() must be implemented by subclasses');
    }

    /**
     * Get available command suggestions for frontend interfaces.
     * These are human-readable command examples that can be displayed to users.
     * 
     * @returns {Array} Array of command suggestion strings
     * @example
     * ['inspect device [name]', 'turn on [device]', 'turn off [device]']
     */
    getCommandSuggestions() {
        return [];
    }

    /**
     * Get the component name this command belongs to.
     * Used for organizing commands and determining which component to load.
     * 
     * @abstract
     * @returns {string} The component name
     */
    getComponentName() {
        throw new Error('getComponentName() must be implemented by subclasses');
    }

    /**
     * Handle errors consistently across all commands.
     * 
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error object
     * @param {string} component - The component name for logging
     * @returns {Object} Error response object
     */
    handleError(operation, error, component = null) {
        const logComponent = component || this.getComponentName();
        logger.error(`Error ${operation}: ${error.message}`, logComponent);
        return { 
            error: error.message,
            operation: operation,
            component: logComponent
        };
    }

    /**
     * Log successful operations.
     * 
     * @param {string} operation - The operation that succeeded
     * @param {string} component - The component name for logging
     */
    logSuccess(operation, component = null) {
        const logComponent = component || this.getComponentName();
        logger.info(operation, logComponent);
    }

    /**
     * Retrieve a specific component by name using Fluent.
     *
     * @param {string} name - The name of the component to retrieve.
     * @returns {Object} The requested component.
     */
    getComponent(name) {
        return this.Fluent._component().get(name);
    }

    /**
     * Get the event component, commonly used across commands.
     *
     * @returns {Object} The event component instance.
     */
    event() {
        return this.getComponent('event');
    }
}

module.exports = Command;
