const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isBetween = require('dayjs/plugin/isBetween')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(advancedFormat)

const schedule = require('node-schedule')
const SunCalc = require('suncalc')
const logger = require('./../../logger')
const config = require('./../../config')
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
        
        // Default location (Bangkok, Thailand) - can be overridden with setLocation()
        this.location = {
            latitude: 13.7563,
            longitude: 100.5018
        }
        
        // Try to load location from config if available
        try {
            if (config && typeof config.get === 'function') {
                this.location.latitude = config.get('location.latitude', this.location.latitude)
                this.location.longitude = config.get('location.longitude', this.location.longitude)
            }
        } catch (error) {
            // Config may not be available during testing, use defaults
            logger.debug('Using default location coordinates', 'datetime')
        }
        
        this._schedules()
        this._setupSolarSchedules()
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
     * Setup solar-based schedules (sunrise, sunset, etc.)
     * 
     * @private
     */
    _setupSolarSchedules() {
        // Calculate solar times for today and schedule events
        this._scheduleSolarEvents()
        
        // Schedule daily recalculation at midnight
        schedule.scheduleJob('0 0 * * *', () => {
            this._scheduleSolarEvents()
        })
    }

    /**
     * Calculate and schedule solar events for the current day
     * 
     * @private
     */
    _scheduleSolarEvents() {
        const today = new Date()
        const times = SunCalc.getTimes(today, this.location.latitude, this.location.longitude)
        
        const solarEvents = {
            'sunrise': times.sunrise,
            'sunset': times.sunset,
            'dawn': times.dawn,
            'dusk': times.dusk,
            'nauticalDawn': times.nauticalDawn,
            'nauticalDusk': times.nauticalDusk,
            'nightEnd': times.nightEnd,
            'night': times.night,
            'goldenHour': times.goldenHour,
            'goldenHourEnd': times.goldenHourEnd
        }

        // Cancel existing solar jobs
        if (this.solarJobs) {
            this.solarJobs.forEach(job => job.cancel())
        }
        this.solarJobs = []

        // Schedule new solar events
        Object.entries(solarEvents).forEach(([eventName, eventTime]) => {
            if (eventTime && !isNaN(eventTime.getTime()) && eventTime > new Date()) {
                const job = schedule.scheduleJob(eventTime, () => {
                    this.emit(`time.${eventName}`)
                    this.emit('solar', eventName)
                    logger.debug(`Solar event triggered: ${eventName} at ${dayjs(eventTime).format('HH:mm')}`, 'datetime')
                })
                this.solarJobs.push(job)
                logger.debug(`Scheduled solar event: ${eventName} at ${dayjs(eventTime).format('HH:mm')}`, 'datetime')
            }
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
                    // Check if it's a solar time (sunrise, sunset, etc.)
                    if (this._isSolarTime(targetTime)) {
                        this.event().on('solar', (eventName) => {
                            if (eventName === targetTime) {
                                scope.assert()
                            }
                        })
                        return scope
                    }
                    
                    // Regular time format (HH:mm)
                    if (!dayjs(targetTime, 'HH:mm', true).isValid()) {
                        throw new Error(`Time "${targetTime}" is not in the correct format of HH:mm or a valid solar time`)
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

    /**
     * Check if a given time string is a solar time
     *
     * @private
     * @param {string} time - Time string to check
     * @returns {boolean} - True if it's a solar time
     */
    _isSolarTime(time) {
        const solarTimes = [
            'sunrise', 'sunset', 'dawn', 'dusk', 
            'nauticalDawn', 'nauticalDusk', 
            'nightEnd', 'night', 
            'goldenHour', 'goldenHourEnd'
        ]
        return solarTimes.includes(time.toLowerCase())
    }

    /**
     * Get current solar times for today
     *
     * @returns {object} - Object containing all solar times for today
     */
    getSolarTimes() {
        const today = new Date()
        return SunCalc.getTimes(today, this.location.latitude, this.location.longitude)
    }

    /**
     * Get the time for a specific solar event
     *
     * @param {string} eventName - Name of the solar event (sunrise, sunset, etc.)
     * @returns {Date|null} - Date object for the solar event or null if invalid
     */
    getSolarTime(eventName) {
        const times = this.getSolarTimes()
        return times[eventName.toLowerCase()] || null
    }

    /**
     * Check if current time matches a solar time (within 1 minute)
     *
     * @param {string} solarEvent - Name of the solar event
     * @returns {boolean} - True if current time matches the solar time
     */
    isSolarTime(solarEvent) {
        const solarTime = this.getSolarTime(solarEvent)
        if (!solarTime) return false
        
        const now = dayjs()
        const solar = dayjs(solarTime)
        return Math.abs(now.diff(solar, 'minute')) <= 1
    }

    /**
     * Update location coordinates for solar calculations
     *
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
     */
    setLocation(latitude, longitude) {
        this.location = { latitude, longitude }
        this._scheduleSolarEvents() // Recalculate with new location
    }
}

module.exports = TimeComponent
