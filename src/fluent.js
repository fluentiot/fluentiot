const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');

const Scenario = require('./scenario.js');
const logger = require('./utils/logger');

class Fluent {

    /**
     * Setup
     */
    static setup() {
        Fluent.config = {};             //Config loaded from ./fluent.config.js
        Fluent.components = {};         //Components loaded in
        Fluent.scenarios = [];          //Scenarios defined
        Fluent.inTestMode = false;      //If in test mode

        //Load config
        const projectRoot = appRoot.path;
        const configPath = path.join(projectRoot, 'fluent.config.js');
        
        try {
            // Load the config file
            Fluent.config = require(configPath);
            logger.log('Fluent config loaded successfully');
        } catch (error) {
            logger.error(error.message);
            process.exit(1);
        }

        //Load components
        Fluent.config.components.forEach((component) => {
            const componentName = component.name;
            let componentPath = component.dir || path.join(__dirname, 'components', componentName);

            componentPath = componentPath.replace('<root>', projectRoot);
            
            const files = fs.readdirSync(componentPath);
            files.forEach(file => {
                if(file.endsWith('_component.js')) {
                    const name = path.basename(file, '_component.js');
                    Fluent.component().add(componentPath, name, false);
                };
            });

        });

        //Init each component
        for(const name in Fluent.components) {
            Fluent.components[name].init(this);
        }
    }

    /**
     * Component DSL
     * 
     * @returns {Object} Component or components
     */
    static component() {
        const load = (directory, name, init) => {
            const file = directory + `/${name}_component.js`;
            const ComponentClass = require(file);
            const componentInstance = new ComponentClass();
            Fluent.components[name] = componentInstance;
            logger.info(`Component "${name}" loaded`);

            if(init) {
                componentInstance.init(this);
            }

            return componentInstance;
        }

        return {
            add: (path, name) => {
                return load(path, name);
            },
            get: (name) => {
                return Fluent.components[name];
            },
            all: (name) => {
                return Fluent.components;
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
    static updateTestMode(scenario) {
        if(scenario) {
            Fluent.inTestMode = true;
            logger.debug(`Test mode on for ${scenario.description}`);
        }

        if(!scenario && !Fluent.inTestMode) {
            return;
        }

        Fluent.scenarios.forEach((scenario) => {
            let runnable = true;
            scenario.runnable = scenario.testMode ? true : false;
        });
    }

}

Fluent.setup();

module.exports = Fluent;
