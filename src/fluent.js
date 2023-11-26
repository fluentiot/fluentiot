const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');

const Scenario = require('./scenario');
const logger = require('./utils/logger');
const config = require('./config');

class Fluent {

    /**
     * Setup
     */
    static setup() {
        Fluent.config = {};             //Config loaded from ./fluent.config.js
        Fluent.components = {};         //Components loaded in
        Fluent.scenarios = [];          //Scenarios defined
        Fluent.inTestMode = false;      //If in test mode

        //Load components defined in the config
        let components = config.get('components') || [];
        Fluent.loadSetupComponents(components);

        //After load
        for(const key in Fluent.components) {
            if(typeof Fluent.components[key].afterLoad === 'function') {
                Fluent.components[key].afterLoad();
            }
        }
    }

    /**
     * Load components specified in the config file
     * @private
     */
    static loadSetupComponents(components) {
        //Load components from config
        const projectRoot = appRoot.path;

        //Load each component
        components.forEach((component) => {
            const componentName = component.name;
            let componentPath = component.path || path.join(__dirname, 'components', componentName);

            componentPath = componentPath.replace('<root>', projectRoot);
            
            const files = fs.readdirSync(componentPath);
            files.forEach(file => {
                if(file.endsWith('_component.js')) {
                    const name = path.basename(file, '_component.js');
                    Fluent.component().add(componentPath, name);
                };
            });

        });
    }

    /**
     * Component DSL
     * @returns {Object} - Component or components
     */
    static component() {
        const load = (componentPath, name) => {
            const file = componentPath + `/${name}_component.js`;

            if (!fs.existsSync(file)) {
                throw new Error(`Component "${name}" not found in ${file}`);
            }

            const ComponentClass = require(file);
            const componentInstance = new ComponentClass(this);
            Fluent.components[name] = componentInstance;
            
            logger.info(`Component "${name}" loaded`);

            return componentInstance;
        }

        return {
            add: (componentPath, name) => {
                return load(componentPath, name);
            },
            get: (name) => {
                if(!Fluent.components[name]) {
                    throw new Error(`Component "${name}" not found`);
                }
                return Fluent.components[name];
            },
            all: () => {
                return Fluent.components;
            }
        }
    }


    /**
     * Scenario DSL
     * @returns {Object} Component or components
     */
    static scenario() {
        const create = (description) => {
            //Description is always needed
            if(!description) {
                throw new Error(`Scenario description must be defined`);
            }
    
            // Check if the description has already been used
            for (const scenario of Fluent.scenarios) {
                if (scenario.description === description) {
                    throw new Error(`Scenario with description '${description}' already exists`);
                }
            }
            
            const scenario = new Scenario(this, description)
            Fluent.scenarios.push(scenario);
    
            //Make sure all future creations of scenario are updated if test mode is on
            Fluent.updateTestMode();
    
            return scenario;
        }

        return {
            create: (description) => {
                return create(description);
            },
            all: () => {
                return Fluent.scenarios;
            }
        }
    }


    /**
     * Set test mode will switch all other scenarios off from asserting/running
     * Multiple scenarios can have test mode enabled, this is useful for debugging
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
            scenario.runnable = scenario.testMode ? true : false;
        });
    }

}

Fluent.setup();

module.exports = Fluent;
