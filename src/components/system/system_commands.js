const Command = require('../command');

/**
 * System-wide commands for monitoring and managing the FluentIoT system
 */
class SystemCommands extends Command {
    
    getComponentName() {
        return 'system';
    }

    getCommands() {
        return {
            'system.status': {
                handler: this.getSystemStatus.bind(this),
                description: 'Get current system status including uptime, memory usage, and loaded components',
                parameters: []
            },
            'system.logs': {
                handler: this.getSystemLogs.bind(this),
                description: 'Retrieve recent system logs for debugging and monitoring purposes',
                parameters: [
                    { name: 'level', type: 'string', required: false, description: 'Log level filter (error, warn, info, debug)' },
                    { name: 'limit', type: 'number', required: false, description: 'Maximum number of log entries to return' }
                ]
            },
            'system.components': {
                handler: this.getLoadedComponents.bind(this),
                description: 'List all currently loaded components and their status',
                parameters: []
            }
        };
    }

    getCommandSuggestions() {
        return [
            'status',
            'logs',
            'show system status',
            'list components'
        ];
    }

    getSystemStatus(params) {
        try {
            const status = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
                platform: process.platform,
                timestamp: new Date(),
                components: Object.keys(this.Fluent.components || {}),
                scenarios: Object.keys(this.Fluent.scenarios || {})
            };
            
            this.logSuccess('System status retrieved');
            return status;
        } catch (error) {
            return this.handleError('getting system status', error);
        }
    }

    getSystemLogs(params) {
        try {
            // This would integrate with the logger to return recent logs
            // For now, returning a placeholder
            this.logSuccess('System logs requested');
            return { 
                message: 'Log retrieval not implemented yet',
                note: 'This will be implemented to return recent log entries from the logger'
            };
        } catch (error) {
            return this.handleError('getting system logs', error);
        }
    }

    getLoadedComponents(params) {
        try {
            const components = {};
            Object.keys(this.Fluent.components || {}).forEach(name => {
                const component = this.Fluent.components[name];
                components[name] = {
                    name: name,
                    type: component.constructor.name,
                    hasCommands: this.hasCommands(name)
                };
            });
            
            this.logSuccess(`Found ${Object.keys(components).length} loaded components`);
            return components;
        } catch (error) {
            return this.handleError('getting loaded components', error);
        }
    }

    /**
     * Check if a component has associated commands
     * @param {string} componentName - The name of the component
     * @returns {boolean} True if the component has commands
     */
    hasCommands(componentName) {
        try {
            return this.Fluent.commands && this.Fluent.commands[componentName] !== undefined;
        } catch (error) {
            return false;
        }
    }
}

module.exports = SystemCommands;
