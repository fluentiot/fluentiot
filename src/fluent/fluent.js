const fs = require('fs');
const path = require('path');

const Scenario = require('./scenario.js');

class Fluent {

    /**
     * Dynamically loads components from the specified directory
     * 
     * @param {string} componentPath - Path to the directory containing components
     * @returns {Object} - Object with loaded components
     */
    static loadComponents(componentPath) {
        try {
            const directories = fs.readdirSync(componentPath);

            directories.forEach(directory => {
                const name = directory;
                const dirPath = path.join(componentPath, directory);
                const filePath = path.join(dirPath, `${name}_component.js`);
                Fluent.loadComponent(`../components/${directory}/${name}_component.js`, name);
            });

            //Start each component after they have been loaded in
            for(const name in Fluent.components) {
                Fluent.components[name].init(this);
            }

            return Fluent.components;
        }
        catch (error) {
            console.error(`Error loading components: ${error.message}`);
            return {};
        }
    }

    static loadComponent(path, name) {
        const ComponentClass = require(path);
        const componentInstance = new ComponentClass();
        Fluent.components[name] = componentInstance;
    }

    static getComponents() {
        return Fluent.components;
    }

    static component() {
        return {
            get:(name) => {
                return Fluent.components[name];
            }
        }
    }

    /**
     * Create a new scenario
     * 
     * @param {string} description - Description of the scenario in human readable format
     * @returns {Object} - New scenario object
     */
    static createScenario(description) {
        if(!description) {
            throw new Error(`Scenario description must be defined`);
        }

        const scenario = new Scenario(this, description)
        Fluent.scenarios.push(scenario);

        //Make sure all future creations of scenario are updated if test mode is on
        Fluent.updateTestMode();

        return scenario;
    }


    /**
     * Set test mode will switch all other scenarios off from asserting/running
     * Multiple scenarios can have test mode enabled, this is useful for debugging
     * 
     * @param {Object} scenario - Scenario object
     */
    static updateTestMode() {
        Fluent.scenarios.forEach((scenario) => {
            scenario.runnable = scenario.testMode ? true : false;
        });
    }

}

Fluent.components = {};
Fluent.scenarios = [];

module.exports = Fluent;
