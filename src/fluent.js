const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')

const Scenario = require('./scenario')
const logger = require('./commons/logger')
const config = require('./config')

const { QueryDslMixin } = require('./components/_mixins/query_dsl')

/**
 * Fluent IoT Framework
 *
 * @class
 */
class Fluent {

    /**
     * Setup
     */
    static setup() {
        Fluent.config = {} //Config data
        Fluent.components = {} //Components loaded in
        Fluent.scenarios = {} //Scenarios defined
        Fluent.inTestMode = false //If in test mode

        // If running in jest, don't show splash screen
        if (process.env.JEST_WORKER_ID === undefined) {
            Fluent.splash()
        }

        // Load components defined in the config
        let components = config.get('components') || []
        Fluent.loadSetupComponents(components)

        // After load callback
        for (const key in Fluent.components) {
            if (typeof Fluent.components[key].afterLoad === 'function') {
                Fluent.components[key].afterLoad()
            }
        }

        // DSL shortcuts
        Fluent.scenario = Fluent._scenario()
        Fluent.component = Fluent._component()

        logger.info(`Fluent IoT Ready`, 'fluent');
    }

    /**
     * Show splash screen
     */
    static splash() {
        console.log(
            " _____ _                  _   ___    _____ \n" +
            "|  ___| |_   _  ___ _ __ | |_|_ _|__|_   _|\n" +
            "| |_  | | | | |/ _ \\ '_ \\| __|| |/ _ \\| |  \n" +
            "|  _| | | |_| |  __/ | | | |_ | | (_) | |  \n" +
            "|_|   |_|\\__,_|\\___|_| |_|\\__|___\\___/|_|  "
        );
        console.log("\nhttps://github.com/darrenmoore/fluent-iot\n");
    }

    /**
     * Load components specified in the config file
     *
     * @param {array} components - List of components to load
     * @private
     */
    static loadSetupComponents(components) {
        // Load components from config
        const projectRoot = appRoot.path

        // Load each component
        components.forEach((component) => {
            const componentName = component.name
            let componentPath = component.path || path.join(__dirname, 'components', componentName)

            componentPath = componentPath.replace('<root>', projectRoot)

            const files = fs.readdirSync(componentPath)
            files.forEach((file) => {
                if (file.endsWith('_component.js')) {
                    const name = path.basename(file, '_component.js')
                    Fluent._component().add(componentPath, name)
                }
            })
        })
    }

    /**
     * Component DSL
     *
     * @returns {Object} - Component or components
     */
    static _component() {
        const load = (componentPath, name) => {
            const file = componentPath + `/${name}_component.js`

            if (!fs.existsSync(file)) {
                throw new Error(`Component "${name}" not found in ${file}`)
            }

            const ComponentClass = require(file)
            const componentInstance = new ComponentClass(this)
            Fluent.components[name] = componentInstance

            logger.info(`Component "${name}" loaded`, 'fluent')

            return componentInstance
        }

        // DSL for Components
        let dsl = {
            add: (componentPath, name) => {
                return load(componentPath, name)
            }
        }

        // Mixins
        dsl = Object.assign(dsl, QueryDslMixin(Fluent, () => { return Fluent.components }))

        return dsl
    }

    /**
     * Scenario DSL
     *
     * @returns {object|array} - Scenario instance or instances
     */
    static _scenario() {
        const add = (description, ...args) => {
            // Description is always needed
            if (!description) {
                throw new Error(`Scenario description must be defined`)
            }

            // Check if the description has already been used
            for (const key in Fluent.scenarios) {
                if (key === description) {
                    throw new Error(`Scenario with description '${description}' already exists`)
                }
            }

            const scenario = new Scenario(this, description, ...args)
            Fluent.scenarios[description] = scenario

            // Make sure all future creations of scenario are updated if test mode is on
            Fluent.updateTestMode()

            return scenario
        }

        // DSL for Scenarios
        let dsl = {
            add: (description, ...args) => {
                return add(description, ...args)
            }
        }

        // Mixins
        dsl = Object.assign(dsl, QueryDslMixin(Fluent, () => { return Fluent.scenarios }))

        return dsl
    }

    /**
     * Set test mode will switch all other scenarios off from asserting/running
     * Multiple scenarios can have test mode enabled, this is useful for debugging
     *
     * @param {Object} scenario - Scenario object
     */
    static updateTestMode(scenario) {
        if (scenario) {
            Fluent.inTestMode = true
            logger.debug(`Test mode "on" for "${scenario.description}"`, 'fluent')
        }

        if (!scenario && !Fluent.inTestMode) {
            return
        }

        for (const key in Fluent.scenarios) {
            if (Fluent.scenarios[key].testMode) {
                Fluent.scenarios[key].runnable = true
            } else {
                Fluent.scenarios[key].runnable = false
            }
        }
    }

}

Fluent.setup()

module.exports = Fluent
