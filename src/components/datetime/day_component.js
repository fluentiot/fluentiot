const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isBetween = require('dayjs/plugin/isBetween')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(advancedFormat)

const logger = require('./../../commons/logger')
const Component = require('./../component')

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
        super(Fluent)
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
                        return this.is(targetDay)
                    }
                },
                between: (targetStart, targetEnd) => {
                    return () => {
                        return this.between(targetStart, targetEnd)
                    }
                },
            },
        }
    }

    /**
     * Is day
     * 
     * @param {string} targetDay 
     * @returns {boolean}
     */
    is(targetDay) {
        const parsedDays = this._parseDay(targetDay)
        const today = dayjs().format('dddd')
        return parsedDays.some((parsedDay) => parsedDay.toLowerCase() === today.toLowerCase())
    }

    /**
     * Between
     * 
     * @param {string} targetStart 
     * @param {string} targetEnd 
     * @returns {boolean}
     */
    between(targetStart, targetEnd) {
        try {
            return this.isCurrentDateInRange(targetStart, targetEnd)
        } catch (e) {
            logger.error(
                `Date format for between constraint not correct, "${targetStart}" / "${targetEnd}"`,
                'datetime'
            )
            return false
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
        const validDays = {
            sunday: 'Sunday',
            sun: 'Sunday',
            monday: 'Monday',
            mon: 'Monday',
            tuesday: 'Tuesday',
            tue: 'Tuesday',
            wednesday: 'Wednesday',
            wed: 'Wednesday',
            thursday: 'Thursday',
            thu: 'Thursday',
            thur: 'Thursday',
            friday: 'Friday',
            fri: 'Friday',
            saturday: 'Saturday',
            sat: 'Saturday',
            weekend: ['Saturday', 'Sunday'],
            weekday: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        }
        const results = []

        const parseSingleDay = (day) => {
            let parsedDay = []
            day = day.toLowerCase()

            if (day in validDays) {
                const dayValue = validDays[day]
                if (Array.isArray(dayValue)) {
                    // If the day is an array, merge it into parsedDay
                    parsedDay = parsedDay.concat(dayValue)
                } else {
                    // If the day is a string, add it to parsedDay
                    parsedDay.push(dayValue)
                }
            } else {
                logger.error(`Could not parse day "${day}"`, 'datetime')
            }

            // Add the parsedDay to the results array
            results.push(...parsedDay)
        }

        //Handle input
        if (Array.isArray(input)) {
            input.forEach((day) => parseSingleDay(day))
        } else if (typeof input === 'string') {
            parseSingleDay(input)
        } else {
            logger.error(`Invalid "${input}" input. Expected a string or an array of strings`, 'datetime')
        }

        return results
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
        let startDate, endDate

        startDate = this.parseDate(targetStart)
        endDate = this.parseDate(targetEnd)

        // If the end date is before the startDate, it means that the end date is in the next year
        if (endDate.isBefore(startDate)) {
            endDate = endDate.add(1, 'year')
        }

        if (!startDate || !endDate) {
            throw new Error(`Date formats are invalid`)
        }

        return dayjs().isBetween(startDate, endDate, 'day', '[]') // '[]' includes both start and end dates
    }

    /**
     * Parses the date string and returns a dayjs object.
     *
     * @param {string} dateStr - The date string to be parsed.
     * @returns {object} - A dayjs object representing the parsed date.
     */
    parseDate(dateStr) {
        const year = dayjs().year() // Use the current year by default
        const dateWithoutYear = dayjs(dateStr, ['MMMM D', 'MMM D', 'Do MMM', 'D MMM', 'MMMM Do', 'MMM Do', 'Do MMMM', 'Do MMM', 'D MMMM'], true) // Try to parse without the year

        if (dateWithoutYear.isValid()) {
            return dateWithoutYear.year(year)
        }

        // If parsing without the year fails, try with the year
        const dateWithYear = dayjs(
            dateStr,
            ['YYYY-MM-DD', 'MM/DD/YYYY', 'MMMM D YYYY', 'MMM D YYYY', 'Do MMM YYYY', 'D MMM YYYY'],
            true
        )
        if (dateWithYear.isValid()) {
            return dateWithYear
        }

        return false
    }
}

module.exports = DayComponent
