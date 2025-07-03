const { datetime } = require('./utils')
const logger = require('./logger')
const LoggingMixin = require('./components/_mixins/logging_mixin')

/**
 * Scenario
 *
 * @class
 */
class Scenario {

    /**
     * Constructor of a new scenario
     *
     * @param {Object} Fluent - Fluent static
     * @param {String} description - Description of the scenario
     * @param {object} properties - Properties for scenario
     */
    constructor(Fluent, description, properties = {}) {
        //Validate
        if (!Fluent) {
            throw new Error(`Fluent core not passed, you should not call scenario directly`)
        }
        if (!description) {
            throw new Error(`Description is required for a scenario`)
        }

        this.Fluent = Fluent            //Singleton object for core
        this.description = description  //Verbose description of the scenario

        this.suppressUntil = null       //Suppress until time
        this.lastAssertTime = null      //When the scenario last asserted
        this.testMode = false           //In test mode
        this.runnable = true            //Can scenario be run? Can be switched when .test() mode is used
        this.triggers = {}              //Triggers from components loaded in
        this.callbacks = []             //Stores a group of constraints and callbacks for that group
        this.trace = []                 //Debug stack trace
        this.properties = {}            //Scenario properties

        // Scenario properties
        const validProperties = ['suppressFor', 'only'];

        // Validate properties
        const invalidKeys = Object.keys(properties || {}).filter(key => !validProperties.includes(key));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid option(s): ${invalidKeys.join(', ')}`);
        }

        const defaultProperties = {
            only: false,
            suppressFor: 1000
        }
        this.properties = { ...defaultProperties, ...properties }

        // Suppress for duration between triggering scenarios
        if (
            properties.suppressFor !== false &&
            properties.suppressFor !== 0 &&
            properties.suppressFor !== undefined && 
            properties.suppressFor !== defaultProperties.suppressFor) {
            // Parse suppressFor to milliseconds
            this.setSuppressFor(properties.suppressFor)
        }

        // Test mode?
        if (this.properties.only === true) {
            this.testMode = true
            this.Fluent.updateTestMode(this)
        }

        //Fetch all required components from the Fluent / config file
        this.components = this.Fluent.component.list()

        //Setup available triggers based on components loaded
        this._buildTriggersDsl()

        // Mixins
        Object.assign(this, LoggingMixin(this, 'scenario'))

        // Auto-log scenario creation
        logger.info(`Scenario "${description}" loaded`, 'scenario', this, { 
            description: this.description,
            properties: this.properties 
        })
    }

    /**
     * Ad-hoc set the current suppression time for this scenario
     * 
     * This is useful in the case of a light switch being turned off
     * and we want to suppress the PIR sensor for a period of time
     * 
     * @param {*} duration
     * @returns {Boolean} - True if suppression was set
     */
    suppressFor(duration) {
        // Turn off
        if (duration === false || duration === 0) {
            this.suppressUntil = null
            return true
        }

        const parsed = datetime.getDurationInMilliseconds(duration)
        if (parsed === false) {
            throw new Error(`Invalid duration "${duration}"`)
        }

        this.suppressUntil = Date.now() + parsed
        return true
    }

    /**
     * Suppress scenario for a duration
     * 
     * @param {string} duration 
     * @returns
     */
    setSuppressFor(duration) {
        const parsed = datetime.getDurationInMilliseconds(duration)
        if (parsed === false) {
            throw new Error(`Invalid duration "${duration}" set for suppressFor`)
        }
        this.properties.suppressFor = parsed
        return this
    }

    /**
     * Build DSL triggers
     *
     * @private
     */
    _buildTriggersDsl() {
        //Basic triggers
        this.triggers.empty = () => {
            return this.when()
        }
        this.triggers.constraint = (...args) => {
            return this.constraint(...args)
        }
        this.triggers.then = (callback) => {
            return this.then(callback)
        }
        this.triggers.assert = (...args) => {
            this.assert(...args)
        }

        //Component triggers
        for (const componentName in this.components) {
            const component = this.components[componentName]
            if (typeof component.triggers === 'function') {
                Object.assign(this.triggers, component.triggers(this.triggers))
            }
        }
    }

    /**
     * When
     *
     * @param {?Object} callback - Custom trigger
     * @returns {Object} - Trigger scope
     */
    when(callback) {
        if (callback) {
            return callback(this)
        }
        return this.triggers
    }

    /**
     * New group of constraints
     *
     * @param {Array} constraints - Recursive list of individual constraints
     * @returns {*}
     */
    constraint(constraints) {
        //Normal constraints referencing components
        if (!constraints) {
            constraints = []
        }

        //Component constraints must be built each time to retain the constraints scope
        let methods = {}
        methods.then = (callback) => {
            return this.then(callback, constraints)
        }

        for (const componentName in this.components) {
            const component = this.components[componentName]

            if (typeof component.constraints !== 'function') {
                continue
            }

            const componentConstraints = component.constraints(this, constraints)
            Object.assign(methods, componentConstraints)
        }

        //Deep search through methods object then proxy each call and console log the method called
        const methodsProxy = this._createProxyForConstraints(methods, constraints)

        return methodsProxy
    }

    /**
     * Proxy each constraint method
     *
     * @private
     * @param {*} obj
     * @param {*} constraints
     * @returns
     */
    _createProxyForConstraints(obj, constraints) {
        return new Proxy(obj, {
            get: (target, prop, receiver) => {
                //console.log(prop + ' = ' + typeof target[prop]);

                if (typeof target[prop] === 'function') {
                    return (...args) => {
                        const result = target[prop].apply(target, args)

                        //console.log(target);
                        //console.log(`Method ${prop} called with arguments ${args.join(', ')}. Result: ${result}`);

                        // Check if the result is an object with keys
                        if (result && typeof result === 'object' && Object.keys(result).length > 0) {
                            // If keys are present, create a proxy for the result
                            return this._createProxyForConstraints(result, constraints)
                        }

                        //Constraint
                        if (typeof result === 'function') {
                            //console.log(`Method ${prop} called with arguments ${args.join(', ')}. Result: ${result}`);
                            constraints.push(result)
                            return this.constraint(constraints)
                        }

                        return result
                    }
                } else if (typeof target[prop] === 'object' && target[prop] !== null) {
                    // Recursively create proxy for nested objects
                    return this._createProxyForConstraints(target[prop], constraints)
                }

                return target[prop]
            },
        })
    }

    /**
     * Else used for constraint groups
     *
     * @returns {Object}
     */
    else() {
        return {
            then: (callback) => {
                return this.then(callback)
            },
        }
    }

    /**
     * Then
     *
     * @param {*} callback - Callback method when scenario is asserted
     * @param {Array} constraints - Set of constraints for this individual callback
     * @returns
     */
    then(callback, constraints) {
        this.callbacks.push({
            callback,
            constraints,
        })
        return this
    }

    /**
     * Assert wrapper
     * 
     * @param  {...any} args - Arguments to be passed to the callback
     * @returns 
     */
    assert(...args) {
        this._assert(...args)
        return this
    }

    /**
     * Assert scenario
     *
     * @param {*} ...args - To be passed to the callback
     * @returns {Boolean}
     */
    _assert(...args) {
        // Scenario might not be runnable, runnable is set to false when .test() is used in another scenario
        if (!this.runnable) {
            return false
        }

        // suppressFor checks
        const currentTime = Date.now();
        if (
            this.suppressUntil !== null &&
            currentTime < this.suppressUntil
        ) {
            logger.warn(`Scenario "${this.description}" did not trigger because in suppressFor period`, 'scenario', this);
            return false;
        }


        // Total executions with constraints
        let callbacks = []  // Matched constraints for callbacks
        let executionsWithConstraints = 0 // Total executions with constraints

        this.callbacks.forEach((callbackItem) => {
            const constraints = callbackItem.constraints || []

            // Run all constraints
            const constraintsMet = constraints.length === 0 || constraints.every((constraint) => constraint())

            // If a callback has run with constraints already and this callback
            // has no constraints then do not run. This is probably an else()
            if (executionsWithConstraints > 0 && constraints.length === 0) {
                return
            }

            // Run constraint group callback
            if (constraintsMet) {
                callbacks.push(callbackItem)

                if (constraints.length > 0) {
                    executionsWithConstraints++
                }
            }
        })

        // No callbacks to run
        if (callbacks.length === 0) {
            logger.debug(`Scenario "${this.description}" constraint not met - scenario not triggered`, 'scenario', this);
            return false
        }
    
        // Set last assert time
        this.lastAssertTime = currentTime

        // Update suppressUntil if suppressFor is set
        if (this.properties.suppressFor > 0) {
            this.suppressUntil = currentTime + this.properties.suppressFor
        }

        // Run callbacks
        let ranCallback = true
        logger.info(`Scenario "${this.description}" triggered`, 'scenario', this)

        callbacks.forEach((callbackItem) => {
            try {
                callbackItem.callback(this, ...args)
                ranCallback = true
            } catch(e) {
                logger.error(`Scenario "${this.description}" has an error with the actions: ${e.message}`, 'scenario', this, { error: e.stack })
                logger.error(e, 'scenario')
                ranCallback = false
            }
        })

        return ranCallback
    }

    /**
     * Get a clean description of the scenario for inspection
     * @returns {Object} - Clean description object
     */
    describe() {
        return {
            description: this.description,
            type: 'scenario',
            runnable: this.runnable,
            testMode: this.testMode,
            properties: this.properties,
            suppressUntil: this.suppressUntil,
            lastAssertTime: this.lastAssertTime,
            triggersCount: Object.keys(this.triggers).length,
            callbacksCount: this.callbacks.length,
            traceCount: this.trace.length,
            recentLogs: this.log.recent(5),
            logStats: this.log.stats
        };
    }
}

module.exports = Scenario
