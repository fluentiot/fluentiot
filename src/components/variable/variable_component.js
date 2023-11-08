const moment = require('moment');
const schedule = require('node-schedule');

const VariableTriggers = require('./variable_triggers');
const VariableConstraints = require('./variable_constraints');

class VariableComponent {

    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');
        this.variables = {};
    }

    set(name, value, expiry) {
        this.variables[name] = value;
        this.Event.emit('variable', { name, value });

        // Check if expiry is provided
        if (expiry) {
            const [duration, unit] = expiry.split(' ');
            const expirationTime = moment().add(parseInt(duration), unit);

            // Schedule a job to remove the variable after the specified duration
            schedule.scheduleJob(expirationTime.toDate(), () => {
                this.remove(name);
            });
        }
    }

    remove(name) {
        delete this.variables[name];
        this.Event.emit('variable.remove', { name });
    }

    get(name) {
        return this.variables.hasOwnProperty(name) ? this.variables[name] : null;
    }

    triggers(Scenario) {
        return {
            variable: (variableName) => {
                return {
                    is: (variableValue) => {
                        new VariableTriggers(Scenario, this.Event).is(variableName, variableValue);
                        return Scenario.triggers;
                    },
                    changes: () => {
                        new VariableTriggers(Scenario, this.Event).changes(variableName);
                        return Scenario.triggers;
                    }
                };
            }
        }
    }

    constraints(Scenario, constraints) {
        return {
            variable: (variableName) => {
                return {
                    is: (variableValue) => {
                        constraints.push(() => { return new VariableConstraints(Scenario, this).is(variableName, variableValue); });
                        return Scenario.constraint(constraints)
                    }
                }
            },
        }
    }


}

module.exports = VariableComponent;
