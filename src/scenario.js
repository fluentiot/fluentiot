
const logger = require('./utils/logger');

class Scenario {

    /**
     * Constructor of a new scenario
     * @param {Object} Fluent - Fluent static
     * @param {String} description - Description of the scenario
     */
    constructor(Fluent, description) {
        //Validate
        if(!Fluent) {
            throw new Error(`Fluent core not passed, you should not call scenario directly`);
        }
        if(!description) {
            throw new Error(`Description is required for a scenario`);
        }

        this.Fluent = Fluent;               //Singleton object for core
        this.description = description;     //Verbose description of the scenario

        this.testMode = false;              //In test mode
        this.runnable = true;               //Can scenario be run? Can be switched when .test() mode is used
        this.triggers = {};                 //Triggers from components loaded in
        this.callbacks = [];                //Stores a group of constraints and callbacks for that group
        this.trace = [];                    //Debug stack trace

        this.components = this.Fluent.component().all();

        this.build();

        logger.info(`Scenario "${description}" loaded`);
    }


    /**
     * Build triggers
     */
    build() {
        //Common triggers
        this.triggers.empty = () => {
            return this.when();
        };
        this.triggers.constraint = (...args) => {
            return this.constraint(...args);
        };
        this.triggers.then = (callback) => {
            return this.then(callback);
        };

        //Component triggers
        for (const componentName in this.components) {
            const component = this.components[componentName];
            if (typeof component.triggers === 'function') {
                Object.assign(this.triggers, component.triggers(this));
            }
        }
    }


    /**
     * When
     * @param {?Object} callback - Custom trigger
     * @returns {Object} - Trigger scope
     */
    when(callback) {
        if(callback) {
            return callback(this);
        }
        return this.triggers;
    }


    /**
     * New group of constraints
     * 
     * @param {Array} constraints - Recursive list of individual constraints
     * @returns {*}
     */
    constraint(constraints) {
        //Normal constraints referencing components
        if(!constraints) { constraints = []; }

        //Component constraints must be built each time to retain the constraints scope
        const methods = {};
        methods.then = (callback) => {
            return this.then(callback, constraints);
        };

        for (const componentName in this.components) {
            const component = this.components[componentName];
            if (typeof component.constraints === 'function') {
                Object.assign(methods, component.constraints(this, constraints));
            }
        }

        return methods;
    }


    /**
     * Else used for constraint groups
     * @returns {Object}
     */
    else() {
        return {
            then: (callback) => {
                return this.then(callback);
            }
        }
    }

    /**
     * Then
     * @param {*} callback - Callback method when scenario is asserted
     * @param {Array} constraints - Set of constraints for this individual callback 
     * @returns 
     */
    then(callback, constraints) {
        this.callbacks.push({
            callback,
            constraints
        });
        return this;
    }

    /**
     * Set scenario to test mode
     */
    test() {
        this.testMode = true;
        this.Fluent.updateTestMode(this);
        return this;
    }

    /**
     * Assert scenario
     * @param {*} result - To be passed to the callback
     * @returns {Boolean}
     */
    assert(result) {
        //Scenario might not be runnable, runnable is set to false when .test() is used in another scenario
        if(!this.runnable) {
            return false;
        }

        //Total executions with constraints
        let ranCallback = false;
        let executionsWithConstraints = 0;

        this.callbacks.forEach(callbackItem => {
            const constraints = callbackItem.constraints || [];
            const constraintsMet = constraints.length === 0 || constraints.every(constraint => constraint());

            //If a callback has run with constraints already and this callback
            //has no constraints then do not run. This is probably an else()
            if(executionsWithConstraints > 0 && constraints.length === 0) {
                return ranCallback;
            }
    
            //Run constraint group callback
            if(constraintsMet) {
                ranCallback = true;
                callbackItem.callback(this, result);
                if(constraints.length > 0) { executionsWithConstraints++; }
            }
        });

        return ranCallback;
    }

}

module.exports = Scenario;
