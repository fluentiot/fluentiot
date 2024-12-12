const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isBetween = require('dayjs/plugin/isBetween')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(advancedFormat)

const schedule = require('node-schedule')
const logger = require('./../../logger')
const Component = require('./../component')

/**
 * Time component
 *
 * @extends Component
 * @class
 */
class TimeComponent extends Component {
    /**
     * Constructor
     *
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent)
        this._schedules()
    }

    /**
     * Regular schedules for emitting events
     * 
     * @private
     */
    _schedules() {
        // Schedule an event every minute
        schedule.scheduleJob('*/1 * * * *', () => {
            this.emit('time.minute')
            this.emit('time', dayjs().format('HH:mm'))
        })

        // Schedule an event every hour
        schedule.scheduleJob('0 * * * *', () => {
            this.emit('time.hour')
        })

        // Schedule an event every second
        schedule.scheduleJob('* * * * * *', () => {
            this.emit('time.second')
        })
    }

    /**
     * Defines triggers related to datetime for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(scope) {
        return {
            time: {
                is: (targetTime) => {
                    if (!dayjs(targetTime, 'HH:mm', true).isValid()) {
                        throw new Error(`Time "${targetTime}" is not in the correct format of HH:mm`)
                    }
                    this.event().on('time', (time) => {
                        if (time === targetTime) {
                            scope.assert()
                        }
                    })
                    return scope
                },
                every: (target) => {
                    const parsedSchedule = this._parseCronExpression(target)
                    if (parsedSchedule === null) {
                        throw new Error(`Failed to parse schedule for '${target}'.`)
                    }
                    schedule.scheduleJob(parsedSchedule, () => {
                        scope.assert()
                    })
                    return scope
                },
            },
        }
    }

    /**
     * Defines constraints related to datetime.
     *
     * @returns {object} - An object with constraint methods for datetime.
     */
    constraints() {
        return {
            time: {
                between: (targetStart, targetEnd) => {
                    return () => {
                        return this.isTimeBetween(targetStart, targetEnd)
                    }
                },
                isAfter: (targetStart) => {
                    return () => {
                        return this.isAfter(targetStart)
                    }
                },
                isBefore: (targetStart) => {
                    return () => {
                        return this.isBefore(targetStart)
                    }
                }
            },
        }
    }

    /**
     * Checks if the current time is before now
     *
     * @param {string} start - The start time in the format 'HH:mm'.
     * @returns {boolean} True is the current time is before now, false otherwise.
     */
    isBefore(start) {
        if (!dayjs(start, 'HH:mm', true).isValid()) {
            logger.error(`"${start}" is not in the correct format of HH:mm`,'datetime')
            return false
        }

        const currentTime = dayjs()
        const startTime = dayjs(start, 'HH:mm')
        return currentTime.isBefore(startTime) || currentTime.isSame(startTime, 'minute')
    }

    /**
     * Checks if current time is before now
     *
     * @param {string} start - The start time in the format 'HH:mm'.
     * @returns {boolean} True is the current time is after now, false otherwise.
     */
    isAfter(start) {
        if (!dayjs(start, 'HH:mm', true).isValid()) {
            logger.error(`"${start}" is not in the correct format of HH:mm`,'datetime')
            return false
        }

        const currentTime = dayjs()
        const startTime = dayjs(start, 'HH:mm')
        return currentTime.isAfter(startTime) || currentTime.isSame(startTime, 'minute')
    }

    /**
     * Checks if the current time is within a specified time range.
     *
     * @param {string} start - The start time in the format 'HH:mm'.
     * @param {string} end - The end time in the format 'HH:mm'.
     * @returns {boolean} True if the current time is within the specified range, false otherwise.
     */
    isTimeBetween(start, end) {
        if (!dayjs(start, 'HH:mm', true).isValid()) {
            logger.error(`Start time "${start}" is not in the correct format of HH:mm`,'datetime')
            return false
        }
        if (!dayjs(end, 'HH:mm', true).isValid()) {
            logger.error(`End time "${end}" is not in the correct format of HH:mm`,'datetime')
            return false
        }

        const currentTime = dayjs()
        const startTime = dayjs(start, 'HH:mm')
        const endTime = dayjs(end, 'HH:mm')
    
        // If the end time is before or the same as the start time, it means the range crosses midnight
        if (endTime.isBefore(startTime) || endTime.isSame(startTime, 'minute')) {
            return currentTime.isAfter(startTime) || currentTime.isBefore(endTime)
        }
    
        return currentTime.isAfter(startTime) && currentTime.isBefore(endTime)
    }

    /**
     * Parse cron expression
     *
     * @private
     * @param {string} target - Expression of time, e.g. "10 seconds"
     * @returns {string|null} - Cron tab expression
     */
    _parseCronExpression(target) {
        const match = target.match(/^(\d+)?\s*(?:(second|minute|hour|sec|min|hr)s?)?$/i)
        if (!match) {
            return null
        }

        const value = match[1] ? parseInt(match[1]) : 1 // Default to 1 if no value is specified
        const unit = match[2] ? match[2].toLowerCase() : null

        switch (unit) {
            case 'sec':
            case 'second':
            case 'seconds':
                return `*/${value} * * * * *`
            case 'min':
            case 'minute':
            case 'minutes':
                return `0 */${value} * * * *`
            case 'hr':
            case 'hour':
            case 'hours':
                return `0 0 */${value} * * *`
            default:
                return null
        }
    }
}

module.exports = TimeComponent
