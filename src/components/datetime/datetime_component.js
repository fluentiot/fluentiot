const schedule = require('node-schedule');
const moment = require('moment');
const logger = require('./../../utils/logger');

const Component = require('./../component');

/**
 * Date time component
 *
 * @extends Component
 * @class
 */
class DatetimeComponent extends Component {

    /**
     * Constructor
     */
    constructor(Fluent) {
        super(Fluent);
        this.schedules();
    }

    schedules() {
        // Schedule an event every minute
        schedule.scheduleJob('*/1 * * * *', () => {
            this.emit('datetime.minute');
            this.emit('datetime.time', moment().format('HH:mm'));
        });

        // Schedule an event every hour
        schedule.scheduleJob('0 * * * *', () => {
            this.emit('datetime.hour');
        });
        
        // Schedule an event every second
        schedule.scheduleJob('* * * * * *', () => {
            this.emit('datetime.second');
        });
    }

    /**
     * Defines triggers related to datetime for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(Scenario) {
        return {
            time: {
                is: (targetTime) => { 
                    this.event().on('datetime.time', (time) => {
                        if (time === targetTime) { Scenario.assert(); }
                    });
                    return Scenario.triggers;
                },
                every: (target) => {
                    const parsedSchedule = this._parseCronExpression(target);
                    if (parsedSchedule === null) {
                        throw new Error(`Failed to parse schedule for '${target}'.`);
                    }
                    schedule.scheduleJob(parsedSchedule, () => {
                        Scenario.assert();
                    });
                    return Scenario.triggers;
                }
            },
        }
    }

    constraints() {
        return {
            day: {
                is: (targetDay) => {
                    const parsedDays = this._parseDay(targetDay);
                    const today = moment().format('dddd');
                    return parsedDays.some((parsedDay) => parsedDay.toLowerCase() === today.toLowerCase());
                }
            },
            time: {
                between: (targetStart, targetEnd) => {
                    if (!moment(targetStart, 'HH:mm', true).isValid()) {
                        logger.error(`Start date "${targetStart}" is not in the correct format of HH:mm`,'datetime');
                        return false;
                    }
                    if (!moment(targetEnd, 'HH:mm', true).isValid()) {
                        logger.error(`Start date "${targetStart}" is not in the correct format of HH:mm`,'datetime');
                        return false;
                    }
                    const currentTime = moment().format('HH:mm');
                    return currentTime >= targetStart && currentTime <= targetEnd;
                }
            }
        }
    }

    _parseDay(input) {
        const results = [];
    
        const parseSingleDay = (day) => {
            let parsedDay = [];
            day = day.toLowerCase();

            // Include weekends
            if(day === 'weekend') {
                parsedDay.push('Saturday');
                parsedDay.push('Sunday');
            }

            // Include weekdays
            if(parsedDay.length === 0 && day === 'weekday') {
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
                logger.error(`Could not parse day: ${day}`);
            } else {
                results.push(...parsedDay);
            }
        };
    
        if (Array.isArray(input)) {
            input.forEach((day) => parseSingleDay(day));
        } else if (typeof input === 'string') {
            parseSingleDay(input);
        } else {
            logger.error('Invalid input. Expected a string or an array of strings.', 'datetime');
        }
    
        return results;
    }

    _parseCronExpression(target) {
        const match = target.match(/^(\d+)?\s*(?:(second|minute|hour|sec|min|hr)s?)?$/i);

        if (match) {
            const value = match[1] ? parseInt(match[1]) : 1; // Default to 1 if no value is specified
            const unit = match[2] ? match[2].toLowerCase() : null;

            switch (unit) {
                case 'sec':
                case 'second':
                case 'seconds':
                    return `*/${value} * * * * *`;
                case 'min':
                case 'minute':
                case 'minutes':
                    return `0 */${value} * * * *`;
                case 'hr':
                case 'hour':
                case 'hours':
                    return `0 0 */${value} * * *`;
                default:
                    return null;
            }
        }

        return null;
    }

}

module.exports = DatetimeComponent;
