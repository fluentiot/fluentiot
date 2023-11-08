const schedule = require('node-schedule');
const moment = require('moment');

const DatetimeTriggers = require('./datetime_triggers');
const DatetimeConstraints = require('./datetime_constraints');

class DatetimeComponent {

    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');

        this.schedules();
    }

    schedules() {
        // Schedule an event every minute
        schedule.scheduleJob('*/1 * * * *', () => {
            this.Event.emit('datetime.minute');
            this.Event.emit('datetime', moment().format('HH:mm'));
        });

        // Schedule an event every hour
        schedule.scheduleJob('0 * * * *', () => {
            this.Event.emit('datetime.hour');
        });
        
        // Schedule an event every second
        schedule.scheduleJob('* * * * * *', () => {
            this.Event.emit('datetime.second');
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

    constraints(Scenario, constraints) {
        return {
            day: () => {
                return {
                    is: (targetDay) => {
                        constraints.push(() => { return new DatetimeConstraints(this).is(targetDay); });
                        return Scenario.constraint(constraints)
                    }
                }
            },
            time: () => {
                return {
                    between: (targetStart, targetEnd) => {
                        constraints.push(() => { return new DatetimeConstraints(this).between(targetStart, targetEnd); });
                        return Scenario.constraint(constraints)
                    }
                }
            }
        }
    }

}

module.exports = DatetimeComponent;
