const moment = require('moment');
const logger = require('./../../utils/logger');
const Component = require('./../component');

/**
 * Day component
 *
 * @extends Component
 * @class
 */
class DayComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
    }

    /**
     * Defines constraints related to datetime.
     *
     * @returns {object} - An object with constraint methods for datetime.
     */
    constraints() {
        return {
            day: {
                is: (targetDay) => {
                    return () => {
                        const parsedDays = this._parseDay(targetDay);
                        const today = moment().format('dddd');
                        return parsedDays.some((parsedDay) => parsedDay.toLowerCase() === today.toLowerCase());
                    }
                }
            }
        }
    }

    /**
     * Parse day
     * 
     * @private
     * @param {string|array} input - Days to parse, either string or array of strings
     * @returns {array} - Returns a list of formatted days
     */
    _parseDay(input) {
        const results = [];
    
        const parseSingleDay = (day) => {
            let parsedDay = [];
            day = day.toLowerCase();

            // Include weekends
            if (day === 'weekend') {
                parsedDay.push('Saturday');
                parsedDay.push('Sunday');
            }

            // Include weekdays
            if (parsedDay.length === 0 && day === 'weekday') {
                parsedDay.push('Monday');
                parsedDay.push('Tuesday');
                parsedDay.push('Wednesday');
                parsedDay.push('Thursday');
                parsedDay.push('Friday');
            }
        
            // Check if the day is already a valid day name
            if (parsedDay.length === 0 && moment(day, 'ddd', true).isValid()) {
                parsedDay.push(moment(day, 'ddd').format('dddd'));
            }
        
            // Check if the day is already a valid day name
            if (parsedDay.length === 0 && moment(day, 'dddd', true).isValid()) {
                parsedDay.push(moment(day, 'dddd').format('dddd'));
            }
        
            // Log an error if the day couldn't be parsed
            if (parsedDay.length === 0) {
                logger.error(`Could not parse day "${day}"`, 'datetime');
            } else {
                results.push(...parsedDay);
            }
        };
    
        if (Array.isArray(input)) {
            input.forEach((day) => parseSingleDay(day));
        } else if (typeof input === 'string') {
            parseSingleDay(input);
        } else {
            logger.error(`Invalid "${input}" input. Expected a string or an array of strings`, 'datetime');
        }
    
        return results;
    }

}

module.exports = DayComponent;
