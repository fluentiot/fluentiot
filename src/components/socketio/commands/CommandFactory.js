const DeviceCommands = require('./DeviceCommands');
const RoomCommands = require('./RoomCommands');
const ScenarioCommands = require('./ScenarioCommands');
const SceneCommands = require('./SceneCommands');
const SystemCommands = require('./SystemCommands');
const SoundCommands = require('./SoundCommands');

/**
 * Command factory for creating and managing command instances
 */
class CommandFactory {
    constructor(Fluent) {
        this.Fluent = Fluent;
        this.commandInstances = [];
        this.availableCommands = {};
        this.commandSuggestions = [];
        
        this.initializeCommands();
    }

    /**
     * Initialize all command instances and build the command registry
     */
    initializeCommands() {
        // Create instances of all command classes
        this.commandInstances = [
            new DeviceCommands(this.Fluent),
            new RoomCommands(this.Fluent),
            new ScenarioCommands(this.Fluent),
            new SceneCommands(this.Fluent),
            new SystemCommands(this.Fluent),
            new SoundCommands(this.Fluent)
        ];

        // Build the command registry
        this.commandInstances.forEach(commandInstance => {
            Object.assign(this.availableCommands, commandInstance.getCommands());
            this.commandSuggestions.push(...commandInstance.getCommandSuggestions());
        });

        // Add basic commands
        this.commandSuggestions.push('help', 'clear');
    }

    /**
     * Get all available commands
     * @returns {Object} Object with all available commands
     */
    getAvailableCommands() {
        return this.availableCommands;
    }

    /**
     * Get command suggestions for the frontend
     * @returns {Array} Array of command suggestion strings
     */
    getCommandSuggestions() {
        return this.commandSuggestions;
    }

    /**
     * Check if a command exists
     * @param {string} command - Command name
     * @returns {boolean} True if command exists
     */
    hasCommand(command) {
        return this.availableCommands.hasOwnProperty(command);
    }

    /**
     * Execute a command
     * @param {string} command - Command name
     * @param {Object} parameters - Command parameters
     * @returns {*} Command result
     */
    executeCommand(command, parameters = {}) {
        if (!this.hasCommand(command)) {
            throw new Error(`Unknown command: ${command}`);
        }
        
        return this.availableCommands[command](parameters);
    }
}

module.exports = CommandFactory;
