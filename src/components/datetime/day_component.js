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
                },
                between: (targetStart, targetEnd) => {
                    return () => {
                        try {
                            return this.isCurrentDateInRange(targetStart, targetEnd)
                        } catch(e) {
                            logger.error(`Date format for between constraint not correct, "${targetStart}" / "${targetEnd}"`, 'datetime');
                            return false;
                        }
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


    /**
     * Checks if the current date is within the specified date range.
     *
     * @param {string} targetStart - The start date of the range. It can be in the format:
     *   - 'YYYY-MM-DD' for a specific date
     *   - 'days <number>' for a range of upcoming days
     *   - '<month>' for dates in the specified month of the current year
     *   - '<month> <day>' for a specific date in the specified month of the current year
     *   - '<month> <day>' to '<month> <day>' for a recurring date range every year
     * @param {string} targetEnd - The end date of the range. It follows the same format as targetStart.
     *
     * @returns {boolean|string} - Returns true if the current date is within the specified range,
     *   false otherwise. If the input is invalid or dates are not returned, returns a graceful message.
     *
     * @example
     * const result = isCurrentDateInRange('2023-12-01', '2023-12-31'); // Returns true if current date is in December 2023.
     * const result = isCurrentDateInRange('May 6th', 'May 20th'); // Returns true if current date is between May 6th and May 20th of the current year.
     */
    isCurrentDateInRange(targetStart, targetEnd) {
        const currentDate = moment();
        let startDate, endDate;
    
        startDate = this.parseDate(targetStart);
        endDate = this.parseDate(targetEnd);
    
        if (!startDate.isValid() || !endDate.isValid()) {
            throw new Error(`Date formats are invalid`);
        }

        if (endDate.isBefore(startDate)) {
            throw new Error(`End date cannot be before the start date`);
        }
    
        return currentDate.isBetween(startDate, endDate, null, '[]'); // '[]' includes both start and end dates
    }
    
    /**
     * Parses the date string and returns a moment object.
     *
     * @param {string} dateStr - The date string to be parsed.
     * @returns {object} - A moment object representing the parsed date.
     */
    parseDate(dateStr) {
        const year = moment().year(); // Use the current year by default
        const dateWithoutYear = moment(dateStr, ['MMMM D', 'MMM D', 'Do MMM', 'Do MMMM', 'D MMM', 'MMMM Do', 'MMM Do'], true); // Try to parse without the year
    
        if (dateWithoutYear.isValid()) {
            return dateWithoutYear.year(year);
        }
    
        // If parsing without the year fails, try with the year
        const dateWithYear = moment(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY', 'MMMM D YYYY', 'MMM D YYYY', 'Do MMM YYYY', 'D MMM YYYY'], true);
        if (dateWithYear.isValid()) {
            return dateWithYear;
        }
    
        return moment.invalid();
    }
  

}

module.exports = DayComponent;
