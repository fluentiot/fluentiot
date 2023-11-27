const schedule = require('node-schedule');
const moment = require('moment');
const logger = require('./../../utils/logger');

const Component = require('./../component');
const DatetimeTriggers = require('./datetime_triggers');
const DatetimeConstraints = require('./datetime_constraints');

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

    triggers(Scenario) {
        return {
            time: () => {
                return {
                    is: (targetTime) => { 
                        new DatetimeTriggers(Scenario, this.Event).is(targetTime);
                        return Scenario.triggers;
                    },
                    every: (target) => {
                        new DatetimeTriggers(Scenario, this.Event).every(target);
                        return Scenario.triggers;
                    }
                };
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
                    constraints.push(() => { return new DatetimeConstraints(this).between(targetStart, targetEnd); });
                    return Scenario.constraint(constraints)
                }
            }
        }
    }

    _parseDay(input) {
        const weekdayMap = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
        };
    
        const weekendMap = {
            saturday: 'Saturday',
            sunday: 'Sunday',
        };
    
        const result = [];
    
        const parseSingleDay = (day) => {
            let parsedDay = null;
        
            // Check weekdayMap
            if (weekdayMap.hasOwnProperty(day.toLowerCase())) {
                parsedDay = weekdayMap[day.toLowerCase()];
            }
        
            // Check weekendMap
            if (!parsedDay && weekendMap.hasOwnProperty(day.toLowerCase())) {
                parsedDay = weekendMap[day.toLowerCase()];
            }
        
            // Check if the day is already a valid day name
            if (!parsedDay && moment(day, 'dddd', true).isValid()) {
                parsedDay = moment(day, 'dddd').format('dddd');
            }
        
            // Log an error if the day couldn't be parsed
            if (!parsedDay) {
                logger.error(`Could not parse day: ${day}`);
            } else {
                result.push(parsedDay);
            }
        };
    
        if (Array.isArray(input)) {
            input.forEach((day) => parseSingleDay(day));
        } else if (typeof input === 'string') {
            parseSingleDay(input);
        } else {
            logger.error('Invalid input. Expected a string or an array of strings.');
        }
    
        return result;
    }

}

module.exports = DatetimeComponent;
