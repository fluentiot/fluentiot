const logger = require('./../../logger');

/**
 * Command handler for processing commands received via SocketIO
 * Now uses the integrated command system instead of CommandFactory
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
    }

    /**
     * Get available commands for the frontend
     * @returns {Object} Object containing available commands and suggestions
     */
    getAvailableCommands() {
        const allCommands = this.Fluent._command().getAllCommands();
        const allSuggestions = this.Fluent._command().getAllSuggestions();
        
        return {
            commands: Object.keys(allCommands),
            suggestions: allSuggestions,
            commandDetails: this.getCommandDetails()
        };
    }

    /**
     * Get detailed information about all commands (useful for LLM integration)
     * @returns {Object} Object containing detailed command information
     */
    getCommandDetails() {
        const commandDetails = {};
        const commands = this.Fluent._command().getAll();
        
        Object.keys(commands).forEach(componentName => {
            Object.keys(commands[componentName]).forEach(commandName => {
                const commandInstance = commands[componentName][commandName];
                if (commandInstance && typeof commandInstance.getCommands === 'function') {
                    const commandDefs = commandInstance.getCommands();
                    Object.keys(commandDefs).forEach(cmdKey => {
                        const cmd = commandDefs[cmdKey];
                        commandDetails[cmdKey] = {
                            component: componentName,
                            description: cmd.description || 'No description available',
                            parameters: cmd.parameters || [],
                            suggestions: commandInstance.getCommandSuggestions()
                        };
                    });
                }
            });
        });
        
        return commandDetails;
    }

    /**
     * Check if a command exists
     * @param {string} command - The command to check
     * @returns {boolean} True if the command exists
     */
    hasCommand(command) {
        const allCommands = this.Fluent._command().getAllCommands();
        return allCommands.hasOwnProperty(command);
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
            
            if (!this.hasCommand(command)) {
                callback({
                    success: false,
                    error: `Unknown command: ${command}`,
                    availableCommands: Object.keys(this.Fluent._command().getAllCommands())
                });
                return;
            }

            // Get and execute the command
            const allCommands = this.Fluent._command().getAllCommands();
            const commandHandler = allCommands[command];
            
            let result;
            if (typeof commandHandler === 'function') {
                result = commandHandler(parameters);
            } else if (commandHandler && typeof commandHandler.handler === 'function') {
                result = commandHandler.handler(parameters);
            } else {
                throw new Error(`Command "${command}" has no valid handler`);
            }
            
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
