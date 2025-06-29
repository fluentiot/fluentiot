const logger = require('./../../logger');
const CommandFactory = require('./commands/CommandFactory');

/**
 * Command handler for processing commands received via SocketIO
 *
 * @class
 */
class CommandHandler {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework instance
     */
    constructor(Fluent) {
        this.Fluent = Fluent;
        this.commandFactory = new CommandFactory(Fluent);
    }

    /**
     * Get available commands for the frontend
     * @returns {Object} Object containing available commands and suggestions
     */
    getAvailableCommands() {
        return {
            commands: Object.keys(this.commandFactory.getAvailableCommands()),
            suggestions: this.commandFactory.getCommandSuggestions()
        };
    }

    /**
     * Execute a command
     * 
     * @param {Object} commandData - Command data containing type, parameters, etc.
     * @param {Function} callback - Callback function to handle the result
     */
    execute(commandData, callback) {
        try {
            const { command, parameters = {} } = commandData;
            
            logger.info(`Executing command: ${command}`, 'socketio-cmd');
            
            if (!this.commandFactory.hasCommand(command)) {
                callback({
                    success: false,
                    error: `Unknown command: ${command}`,
                    availableCommands: Object.keys(this.commandFactory.getAvailableCommands())
                });
                return;
            }

            // Execute the command
            const result = this.commandFactory.executeCommand(command, parameters);
            
            // Handle promises
            if (result instanceof Promise) {
                result
                    .then(res => callback({ success: true, data: res }))
                    .catch(err => callback({ success: false, error: err.message }));
            } else {
                callback({ success: true, data: result });
            }
            
        } catch (error) {
            logger.error(`Command execution error: ${error.message}`, 'socketio-cmd');
            callback({ success: false, error: error.message });
        }
    }
}

module.exports = CommandHandler;
