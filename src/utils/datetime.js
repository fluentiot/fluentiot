const dayjs = require('dayjs');

// Regex to match duration format
const DURATION_REGEX = /^(\d+)?\s*(?:(second|minute|hour|sec|min|hr|ms|millisecond)s?)?$/i;

// Error messages
const INVALID_FORMAT_ERROR = 'Invalid duration format';
const INVALID_UNIT_ERROR = 'Invalid duration unit';

/**
 * Add duration to current time
 * 
 * @param {string} duration - Duration to add to current time
 * @returns {dayjs.Dayjs} - New date time
 */
function addDurationToNow(duration) {
    const match = duration.match(DURATION_REGEX);
    if (!match) {
        throw new Error(INVALID_FORMAT_ERROR);
    }

    const value = match[1] ? parseInt(match[1]) : 1;
    const unit = match[2] ? match[2].toLowerCase() : 'ms'; // Default to milliseconds if no unit is specified

    switch (unit) {
        case 'sec':
        case 'second':
        case 'seconds':
            return dayjs().add(value, 'second');
        case 'min':
        case 'minute':
        case 'minutes':
            return dayjs().add(value, 'minute');
        case 'hr':
        case 'hour':
        case 'hours':
            return dayjs().add(value, 'hour');
        case 'ms':
        case 'millisecond':
        case 'milliseconds':
            return dayjs().add(value, 'millisecond');
        default:
            throw new Error(INVALID_UNIT_ERROR);
    }
}

/**
 * Get duration in milliseconds
 * 
 * @param {string} duration - Duration in milliseconds
 * @param {string} defaultUnit - Default unit to use if no unit is specified
 * @returns {number} - Duration in milliseconds 
 */
function getDurationInMilliseconds(duration, defaultUnit = 'ms') {
    if (typeof duration === 'number') {
        return duration
    }

    const match = duration.match(DURATION_REGEX)
    if (!match) {
        throw new Error(INVALID_FORMAT_ERROR)
    }

    const value = match[1] ? parseInt(match[1]) : 1
    const unit = match[2] ? match[2].toLowerCase() : defaultUnit

    switch (unit) {
        case 'sec':
        case 'second':
        case 'seconds':
            return value * 1000;
        case 'min':
        case 'minute':
        case 'minutes':
            return value * 60 * 1000;
        case 'hr':
        case 'hour':
        case 'hours':
            return value * 60 * 60 * 1000;
        case 'ms':
        case 'millisecond':
        case 'milliseconds':
            return value;
        default:
            throw new Error(INVALID_UNIT_ERROR);
    }
}

/**
 * Get duration in minutes
 * 
 * @param {string} duration - Duration in minutes
 * @returns {number} - Duration in minutes
 */
function getDurationInMinutes(duration) {
    if (typeof duration === 'number') {
        return duration;
    }
    const milliseconds = getDurationInMilliseconds(duration, 'minute')
    return milliseconds / 60000;
}

module.exports = {
    addDurationToNow,
    getDurationInMilliseconds,
    getDurationInMinutes,
};
