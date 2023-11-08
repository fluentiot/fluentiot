const schedule = require('node-schedule');

class DatetimeTriggers {
    
    constructor(Scenario, Event) {
        this.Scenario = Scenario;
        this.Event = Event;
    }

    is(targetTime) {
        this.Event.on('datetime', (time) => {
            if (time === targetTime) { this.Scenario.assert(); }
        });
        return this;
    }

    every(target) {
        const parsedSchedule = this.parseCronExpression(target);
        if (parsedSchedule) {
            schedule.scheduleJob(parsedSchedule, () => {
                this.Scenario.assert();
            });
        } else {
            throw new Error(`Failed to parse schedule for '${target}'.`);
        }
        return this;
    }

    parseCronExpression(target) {
        const match = target.match(/^(\d+)?\s*(?:(second|minute|hour|sec|min|hr)s?)?$/i);

        if (match) {
            const value = match[1] ? parseInt(match[1]) : 1; // Default to 1 if no value is specified
            const unit = match[2] ? match[2].toLowerCase() : 'second'; // Default to 'second' if no unit is specified

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

module.exports = DatetimeTriggers;
