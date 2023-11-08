
class Scenario {
    constructor(Fluent, description) {
        this.Fluent = Fluent;               //Singleton object for core
        this.description = description;     //Verbose description of the scenario

        this.testMode = false;              //In test mode
        this.runnable = true;               //Can scenario be run? Can be switched when .test() mode is used
        this.triggers = {};                 //Triggers from components loaded in
        this.callbacks = [];                //Stores a group of constraints and callbacks for that group
        this.trace = [];                    //Debug stack trace

        this.components = this.Fluent.getComponents();

        this.build();
    }

    /**
     * Build triggers and constraints
     */
    build() {
        //Common triggers
        this.triggers.empty = () => {
            return this.when();
        };
        this.triggers.constraint = () => {
            return this.constraint();
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


    when() {
        return this.triggers;
    }

    /**
     * New group of constraints
     * 
     * @param {Array} constraints - Recursive list of individual constraints
     * @returns {*}
     */
    constraint(constraints) {
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

    else() {
        return {
            then: (callback) => {
                return this.then(callback);
            }
        }
    }

    test() {
        this.testMode = true;
        this.Fluent.updateTestMode();
    }

    then(callback, constraints) {
        this.callbacks.push({
            callback,
            constraints
        });
        return this;
    }

    assert(result) {
        //Scenario might not be runnable, runnable is set to false when .test() is used in another scenario
        if(!this.runnable) {
            return;
        }

        //Total executions with constraints
        let executionsWithConstraints = 0;

        this.callbacks.forEach(callbackItem => {
            const constraints = callbackItem.constraints || [];
            const constraintsMet = constraints.length === 0 || constraints.every(constraint => constraint());

            //If a callback has run with constraints already and this callback
            //has no constraints then do not run. This is probably an else()
            if(executionsWithConstraints > 0 && constraints.length === 0) {
                return;
            }
    
            //Run constraint group callback
            if(constraintsMet) {
                callbackItem.callback(this, result);
                if(constraints.length > 0) { executionsWithConstraints++; }
            }
        });
        return this;
    }

    /**
     * Execute all callbacks
     */
    execute() {
        this.callbacks.forEach(callbackItem => {
            callbackItem.callback(this);
        });
    }

}

module.exports = Scenario;
