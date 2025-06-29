const Command = require('../command');

/**
 * Scenario-related commands for managing and inspecting automation scenarios
 */
class ScenarioCommands extends Command {
    
    getComponentName() {
        return 'scenario';
    }

    getCommands() {
        return {
            'scenario.list': {
                handler: this.listScenarios.bind(this),
                description: 'List all defined automation scenarios in the system',
                parameters: []
            },
            'scenario.get': {
                handler: this.getScenario.bind(this),
                description: 'Get detailed information about a specific automation scenario',
                parameters: [
                    { name: 'scenarioName', type: 'string', required: true, description: 'The name of the scenario to inspect' },
                    { name: 'action', type: 'string', required: false, description: 'Optional action like "describe" for detailed info' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'inspect scenario [name]',
            'list all scenarios',
            'describe scenario [name]'
        ];
    }

    listScenarios(params) {
        try {
            const scenarios = this.Fluent.scenarios || {};
            const scenarioList = Object.keys(scenarios);
            
            this.logSuccess(`Found ${scenarioList.length} scenarios`);
            return {
                scenarios: scenarioList,
                count: scenarioList.length,
                details: scenarioList.reduce((acc, name) => {
                    const scenario = scenarios[name];
                    acc[name] = {
                        description: scenario.description,
                        runnable: scenario.runnable,
                        testMode: scenario.testMode
                    };
                    return acc;
                }, {})
            };
        } catch (error) {
            return this.handleError('listing scenarios', error);
        }
    }

    getScenario(params) {
        try {
            const { scenarioName, action } = params;
            const scenario = this.Fluent._scenario().get(scenarioName);
            
            if (!scenario) {
                return { error: `Scenario '${scenarioName}' not found` };
            }

            // If action is 'describe', return the clean description
            if (action === 'describe') {
                this.logSuccess(`Describing scenario: ${scenarioName}`);
                return scenario.describe();
            }

            // Otherwise, return a safe summary to avoid circular references
            this.logSuccess(`Getting scenario info: ${scenarioName}`);
            return {
                description: scenario.description,
                runnable: scenario.runnable,
                testMode: scenario.testMode
            };
        } catch (error) {
            return this.handleError('getting scenario', error);
        }
    }
}

module.exports = ScenarioCommands;
