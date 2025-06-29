const BaseCommand = require('./BaseCommand');

/**
 * Scenario commands
 */
class ScenarioCommands extends BaseCommand {
    getCommands() {
        return {
            'scenario.list': this.listScenarios.bind(this),
            'scenario.get': this.getScenario.bind(this)
        };
    }

    getCommandSuggestions() {
        return [
            'inspect scenario [name]'
        ];
    }

    listScenarios(params) {
        try {
            return {
                scenarios: Object.keys(this.Fluent.scenarios),
                count: Object.keys(this.Fluent.scenarios).length
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
                return scenario.describe();
            }

            // Otherwise, return a safe summary to avoid circular references
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
