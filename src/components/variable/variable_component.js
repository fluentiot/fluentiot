const moment = require('moment');
const logger = require('./../../utils/logger');
const Component = require('./../component');
const Expect = require('./../../utils/expect');

/**
 * Variable component
 *
 * @extends Component
 * @class
 */
class VariableComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.variables = {};
    }

    /**
     * Sets a variable with the specified name and value.
     *
     * @param {string} name - The name of the variable.
     * @param {any} value - The value of the variable.
     * @param {object} [options={}] - Additional options for the variable (e.g., expiry).
     * @param {string} [options.expiry] - The expiration duration for the variable.
     * @returns {boolean} - Returns true if the variable is set successfully, false otherwise.
     */
    set(name, value, options = {}) {
        this.variables[name] = { value, options };
        this.emit('variable', { name, value });

        // Check if expiry is provided
        if (options.expiry) {
            const parsedExpiry = this._parseExpiry(options.expiry);
            if (parsedExpiry) {
                options.expiry = parsedExpiry;
            } else {
                logger.error(`Error parsing "${options.expiry}" variable expiry. Please provide a valid duration and unit.`, 'variable');
                return false;
            }
        }

        return true;
    }

    /**
     * Removes a variable with the specified name.
     *
     * @param {string} name - The name of the variable to be removed.
     * @returns {boolean} - Returns true if the variable is removed successfully, false otherwise.
     */
    remove(name) {
        if (!this.variables[name]) {
            return false;
        }
        delete this.variables[name];
        this.emit('variable.remove', { name });
        return true;
    }

    /**
     * Gets the value of a variable with the specified name.
     *
     * @param {string} name - The name of the variable to get.
     * @returns {any|null} - Returns the value of the variable if found and not expired, otherwise returns null.
     */
    get(name) {
        if(!this.variables[name]) {
            logger.error(`Variable "${name}" could not be found`, 'variable');
            return null;
        }

        if(this._checkIfExpired(name)) {
            this.remove(name);
            return null;
        }

        return this.variables[name].value;
    }

    /**
     * Checks if a variable with the specified name is expired.
     *
     * @private
     * @param {string} name - The name of the variable to check for expiry.
     * @returns {boolean} - Returns true if the variable is expired, false otherwise.
     */
    _checkIfExpired(name) {
        const variable = this.variables[name];

        if (variable && variable.options && variable.options.expiry) {
            const expiryMoment = moment(variable.options.expiry);
            const currentMoment = moment();
            return expiryMoment.isBefore(currentMoment);
        }
        
        return false;
    } 

    /**
     * Parses the expiry string and returns a moment object.
     *
     * @private
     * @param {string} expiry - The expiry string (e.g., "1 hour").
     * @returns {moment.Moment|false} - Returns a moment object if parsing is successful, false otherwise.
     */
    _parseExpiry(expiry) {
        const [duration, unit] = expiry.split(' ');
    
        if (!duration || isNaN(parseInt(duration)) || !unit) {
            return false; // Return false if parsing fails
        }
    
        return moment().add(parseInt(duration), unit);
    }
        
    /**
     * Defines triggers related to variables for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for variables.
     */
    triggers(scope) {
        return {
            variable: (variableName) => {
                return {
                    is: (variableValue) => {
                        this.event().on('variable', (changedData) => {
                            if (changedData.name === variableName && changedData.value === variableValue) {
                                scope.assert();
                            }
                        });
                        return scope;
                    },
                    updated: () => {
                        this.event().on('variable', (changedData) => {
                            if (changedData.name === variableName) {
                                scope.assert(changedData.value);
                            }
                        });
                        return scope;
                    }
                };
            }
        }
    }

    /**
     * Defines constraints related to variables.
     *
     * @returns {object} - An object with constraint methods for variables.
     */
    constraints() {
        return {
            variable: (variableName) => {
                if (typeof variableName !== 'string') {
                    logger.error(`Variable "${variableName}" was not passed as a string`, 'variable');
                    return false;
                }

                const callback = () => {
                    let currentValue = undefined;
                    if (this.variables[variableName]) {
                        currentValue = this.get(variableName);
                    }
                    return currentValue;
                }

                return new Expect(callback);
            }
        };
    }


}

module.exports = VariableComponent;
