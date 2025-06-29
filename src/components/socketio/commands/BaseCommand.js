const logger = require('./../../../logger');

/**
 * Base command class that all commands should extend
 */
class BaseCommand {
    constructor(Fluent) {
        this.Fluent = Fluent;
    }

    /**
     * Get the command definitions for this command group
     * @returns {Object} Object with command definitions
     */
    getCommands() {
        throw new Error('getCommands() must be implemented by subclasses');
    }

    /**
     * Get available command suggestions for the frontend
     * @returns {Array} Array of command suggestion strings
     */
    getCommandSuggestions() {
        return [];
    }

    /**
     * Handle errors consistently
     * @param {string} operation - The operation that failed
     * @param {Error} error - The error object
     * @param {string} component - The component name for logging
     * @returns {Object} Error response object
     */
    handleError(operation, error, component = 'socketio-cmd') {
        logger.error(`Error ${operation}: ${error.message}`, component);
        return { error: error.message };
    }

    /**
     * Log successful operations
     * @param {string} operation - The operation that succeeded
     * @param {string} component - The component name for logging
     */
    logSuccess(operation, component = 'socketio-cmd') {
        logger.info(operation, component);
    }
}

module.exports = BaseCommand;
