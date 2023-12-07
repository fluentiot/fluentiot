const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isBetween = require('dayjs/plugin/isBetween')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(advancedFormat)

const schedule = require('node-schedule')
const logger = require('./../../utils/logger')
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
        this.schedules()
    }

    /**
     * Regular schedules for emitting events
     */
    schedules() {
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
                        throw new Error(
                            `Time "${targetTime}" is not in the correct format of HH:mm`
                        )
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
                        throw new Error(
                            `Failed to parse schedule for '${target}'.`
                        )
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
                        if (!dayjs(targetStart, 'HH:mm', true).isValid()) {
                            logger.error(
                                `Start date "${targetStart}" is not in the correct format of HH:mm`,
                                'datetime'
                            )
                            return false
                        }
                        if (!dayjs(targetEnd, 'HH:mm', true).isValid()) {
                            logger.error(
                                `Start date "${targetStart}" is not in the correct format of HH:mm`,
                                'datetime'
                            )
                            return false
                        }
                        const currentTime = dayjs().format('HH:mm')
                        return (
                            currentTime >= targetStart &&
                            currentTime <= targetEnd
                        )
                    }
                },
            },
        }
    }

    /**
     * Parse cron expression
     *
     * @private
     * @param {string} target - Expression of time, e.g. "10 seconds"
     * @returns {string|null} - Cron tab expression
     */
    _parseCronExpression(target) {
        const match = target.match(
            /^(\d+)?\s*(?:(second|minute|hour|sec|min|hr)s?)?$/i
        )
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
