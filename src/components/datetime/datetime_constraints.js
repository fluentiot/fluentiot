const moment = require('moment');

class DatetimeConstraints {
    
    constructor(Scenario) {
        this.Scenario = Scenario;
    }

    is(targetDay) {
        if(targetDay.toLowerCase() === 'weekday') {
            targetDay = ['mon','tue','wed','thu','fri']
        }
        else if(targetDay.toLowerCase() === 'weekend') {
            targetDay = ['sat','sun']
        }

        const targetDays = Array.isArray(targetDay) ? targetDay : [targetDay];
        const currentDay = moment().format('dddd').toLowerCase();

        return targetDays.some(day => currentDay === moment(day, 'dddd').format('dddd').toLowerCase() ||
            currentDay === moment(day, 'ddd').format('dddd').toLowerCase());
    }
    
    between(start, end) {
        // Validate the time format and throw an error if it cannot be parsed
        if (!moment(start, 'HH:mm', true).isValid() || !moment(end, 'HH:mm', true).isValid()) {
            throw new Error('Invalid time format. Please use the format HH:mm.');
        }

        const currentTime = moment().format('HH:mm');
        return currentTime >= start && currentTime <= end;
    }

}

module.exports = DatetimeConstraints;
