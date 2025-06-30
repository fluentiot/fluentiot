const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')

const Scenario = require('./scenario')
const logger = require('./logger')
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
        Fluent.commands = {} //Commands loaded for components
        Fluent.scenarios = {} //Scenarios defined
        Fluent.inTestMode = false //If in test mode

        // If running in jest, don't show splash screen
        if (process.env.JEST_WORKER_ID === undefined) {
            Fluent.splash()
        }

        // Load components defined in the config
        let components = config.get('components') || []
        Fluent.loadSetupComponents(components)

        // Load system commands (these are always available)
        Fluent.loadSystemCommands()

        // After load callback
        for (const key in Fluent.components) {
            if (typeof Fluent.components[key].afterLoad === 'function') {
                Fluent.components[key].afterLoad()
            }
        }

        // DSL shortcuts
        Fluent.scenario = Fluent._scenario()
        Fluent.component = Fluent._component()
        Fluent.command = Fluent._command()

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
        console.log("\nhttps://fluentiot.github.io\n");
    }

    /**
     * Load system-wide commands that are always available
     * @private
     */
    static loadSystemCommands() {
        const projectRoot = appRoot.path
        const systemCommandsPath = path.join(__dirname, 'components', 'system')
        
        if (fs.existsSync(systemCommandsPath)) {
            const files = fs.readdirSync(systemCommandsPath)
            files.forEach((file) => {
                if (file.endsWith('_commands.js')) {
                    const commandName = path.basename(file, '_commands.js')
                    Fluent._command().add(systemCommandsPath, commandName, 'system')
                }
            })
        }
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
                    
                    // Also load commands for this component if they exist
                    Fluent._command().loadForComponent(componentPath, name)
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
            const file = path.resolve(componentPath, `${name}_component.js`);

            if (!fs.existsSync(file)) {
                throw new Error(`Component "${name}" not found in ${file}`);
            }

            const ComponentClass = require(file);
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
     * Command DSL for managing component commands
     *
     * @returns {Object} - Command management object
     */
    static _command() {
        const load = (commandPath, name, component = null) => {
            const file = path.resolve(commandPath, `${name}_commands.js`);

            if (!fs.existsSync(file)) {
                // Commands are optional, so don't throw an error
                return null;
            }

            try {
                const CommandClass = require(file);
                const commandInstance = new CommandClass(Fluent)
                const componentName = component || name
                
                if (!Fluent.commands[componentName]) {
                    Fluent.commands[componentName] = {}
                }
                
                Fluent.commands[componentName][name] = commandInstance

                logger.info(`Commands "${name}" loaded for component "${componentName}"`, 'fluent')

                return commandInstance
            } catch (error) {
                logger.error(`Failed to load commands "${name}": ${error.message}`, 'fluent')
                return null
            }
        }

        const loadForComponent = (componentPath, componentName) => {
            // Try to load commands with the same name as the component
            const commandFile = path.join(componentPath, `${componentName}_commands.js`)
            if (fs.existsSync(commandFile)) {
                return load(componentPath, componentName)
            }
            
            // If not found, try to find any *_commands.js files in the component directory
            if (fs.existsSync(componentPath)) {
                const files = fs.readdirSync(componentPath)
                files.forEach((file) => {
                    if (file.endsWith('_commands.js')) {
                        const commandName = path.basename(file, '_commands.js')
                        load(componentPath, commandName, componentName)
                    }
                })
            }
        }

        // DSL for Commands
        let dsl = {
            add: (commandPath, name, component = null) => {
                return load(commandPath, name, component)
            },
            loadForComponent: (componentPath, componentName) => {
                return loadForComponent(componentPath, componentName)
            },
            get: (componentName, commandName = null) => {
                if (commandName) {
                    return Fluent.commands[componentName] && Fluent.commands[componentName][commandName]
                }
                return Fluent.commands[componentName]
            },
            getAll: () => {
                return Fluent.commands
            },
            getAllCommands: () => {
                const allCommands = {}
                Object.keys(Fluent.commands).forEach(componentName => {
                    Object.keys(Fluent.commands[componentName]).forEach(commandName => {
                        const commandInstance = Fluent.commands[componentName][commandName]
                        if (commandInstance && typeof commandInstance.getCommands === 'function') {
                            Object.assign(allCommands, commandInstance.getCommands())
                        }
                    })
                })
                return allCommands
            },
            getAllSuggestions: () => {
                const allSuggestions = []
                Object.keys(Fluent.commands).forEach(componentName => {
                    Object.keys(Fluent.commands[componentName]).forEach(commandName => {
                        const commandInstance = Fluent.commands[componentName][commandName]
                        if (commandInstance && typeof commandInstance.getCommandSuggestions === 'function') {
                            allSuggestions.push(...commandInstance.getCommandSuggestions())
                        }
                    })
                })
                return allSuggestions
            }
        }

        // Mixins
        dsl = Object.assign(dsl, QueryDslMixin(Fluent, () => { return Fluent.commands }))

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
