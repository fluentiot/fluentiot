const schedule = require('node-schedule')
schedule.scheduleJob = jest.fn()

const mockdate = require('mockdate')
const dayjs = require('dayjs')
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/logger')

// Mock SunCalc for consistent test results
jest.mock('suncalc', () => ({
    getTimes: jest.fn(() => ({
        sunrise: new Date('2000-11-22T06:30:00'),
        sunset: new Date('2000-11-22T18:45:00'),
        dawn: new Date('2000-11-22T06:00:00'),
        dusk: new Date('2000-11-22T19:15:00'),
        nauticalDawn: new Date('2000-11-22T05:30:00'),
        nauticalDusk: new Date('2000-11-22T19:45:00'),
        nightEnd: new Date('2000-11-22T05:00:00'),
        night: new Date('2000-11-22T20:15:00'),
        goldenHour: new Date('2000-11-22T18:00:00'),
        goldenHourEnd: new Date('2000-11-22T07:00:00')
    }))
}))

const TimeComponent = require('./../../../src/components/datetime/time_component')
const Fluent = require('./../../../src/fluent')
const ComponentHelper = require('./../../helpers/component_helper.js')

describe('Time setup', () => {
    it('has setup scheduler', () => {
        new TimeComponent(Fluent)
        // Original 3 schedules plus 1 for daily solar recalculation
        expect(schedule.scheduleJob).toHaveBeenCalledTimes(4)
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(1, '*/1 * * * *', expect.anything())
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(2, '0 * * * *', expect.anything())
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(3, '* * * * * *', expect.anything())
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(4, '0 0 * * *', expect.anything()) // Daily solar recalculation
    })
})

describe('Time isTimeBetween', () => {
    let time
    beforeEach(() => {
        schedule.scheduleJob = jest.fn()
        time = new TimeComponent(Fluent)
    })

    afterEach(() => {
        mockdate.reset()
    })

    it('returns true within a normal time range', () => {
        mockdate.set('2000-11-22 12:30:00');
        expect(time.isTimeBetween('10:00', '15:00')).toBe(true);
    });

    it('returns true within a time range crossing midnight when it is before midnight', () => {
        mockdate.set('2000-11-22 23:30:00');
        expect(time.isTimeBetween('23:00', '03:00')).toBe(true);
    });

    it('returns true within a time range crossing midnight when it is after midnight', () => {
        mockdate.set('2000-11-22 01:30:00');
        expect(time.isTimeBetween('23:00', '03:00')).toBe(true);
    });

    it('returns false for a time range that does not include the current time', () => {
        mockdate.set('2000-11-22 18:30:00');
        expect(time.isTimeBetween('20:00', '22:00')).toBe(false);
    });

    it('returns false when the current time is the same as the end time (not in range)', () => {
        mockdate.set('2000-11-22 09:30:00');
        expect(time.isTimeBetween('08:00', '09:30')).toBe(false);
    });

    it('returns false when the current time is the same as the start time (not in range)', () => {
        mockdate.set('2000-11-22 15:30:00');
        expect(time.isTimeBetween('15:30', '17:00')).toBe(false);
    });

})


describe('Time constraints for "isAfter" and "isBefore"', () => {
    let time
    beforeEach(() => {
        schedule.scheduleJob = jest.fn()
        time = new TimeComponent(Fluent)
    })

    afterEach(() => {
        mockdate.reset()
    })

    it('returns true if is after a certain time', () => {
        mockdate.set('2000-11-22 15:00:00');
        expect(time.constraints().time.isAfter('13:00')()).toBe(true)
    })

    it('returns false if is before a certain time', () => {
        mockdate.set('2000-11-22 10:00:00');
        expect(time.constraints().time.isAfter('13:00')()).toBe(false)
    })

    it('returns true if is before a certain time', () => {
        mockdate.set('2000-11-22 15:00:00');
        expect(time.constraints().time.isBefore('16:00')()).toBe(true)
    })

    it('returns false if is before a certain time', () => {
        mockdate.set('2000-11-22 15:00:00');
        expect(time.constraints().time.isBefore('13:00')()).toBe(false)
    })

    it('returns false if date format is incorrect', () => {
        expect(time.constraints().time.isAfter('xx:xx')()).toBe(false)
        expect(time.constraints().time.isBefore('xx:xx')()).toBe(false)
    })

})


describe('Time constraints for "between"', () => {
    let time
    beforeEach(() => {
        schedule.scheduleJob = jest.fn()
        time = new TimeComponent(Fluent)
    })

    it('between is true when between times', () => {
        const start = dayjs().clone().subtract(1, 'minute').format('HH:mm')
        const end = dayjs().clone().add(1, 'minute').format('HH:mm')
        expect(time.constraints().time.between(start, end)()).toBe(true)
    })

    it('between is false when out of time', () => {
        const start = dayjs().clone().subtract(2, 'minute').format('HH:mm')
        const end = dayjs().clone().subtract(1, 'minute').format('HH:mm')
        expect(time.constraints().time.between(start, end)()).toBe(false)
    })

    it('between is true when exactly now', () => {
        const start = dayjs().format('HH:mm')
        const end = dayjs().clone().add(1, 'minute').format('HH:mm')
        expect(time.constraints().time.between(start, end)()).toBe(true)
    })

    it('between fails if the between start or end date is not valid', () => {
        const any = dayjs().format('HH:mm')
        expect(time.constraints().time.between('zz:aa', any)()).toBe(false)
        expect(time.constraints().time.between(any, 'zz:aa')()).toBe(false)
    })

    it('times between days', () => {
        mockdate.set('2000-11-22 21:00:00');
        expect(time.constraints().time.between('20:00', '03:00')()).toBe(true)
    })

})

describe('Time triggers', () => {
    let Scenario
    let time

    beforeEach(() => {
        time = new TimeComponent(Fluent)
        Scenario = ComponentHelper.ScenarioAndEvent(time)

        schedule.scheduleJob = jest.fn((_schedule, callback) => {
            callback()
        })
    })

    it('time event triggers', () => {
        time.triggers(Scenario).time.is('10:00')
        time.event().emit('time', '10:00')
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('different time event does not trigger', () => {
        time.triggers(Scenario).time.is('10:00')
        time.event().emit('time', '10:01')
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('throws if time format is wrong', () => {
        expect(() => time.triggers(Scenario).time.is('xx:00')).toThrow()
        expect(() => time.triggers(Scenario).time.is('xx:xx')).toThrow()
        expect(() => time.triggers(Scenario).time.is('11:xx')).toThrow()
        expect(() => time.triggers(Scenario).time.is('25:00')).toThrow()
        expect(() => time.triggers(Scenario).time.is(' 11:00 ')).toThrow()
        expect(() => time.triggers(Scenario).time.is('11am')).toThrow()
        expect(() => time.triggers(Scenario).time.is('11')).toThrow()
    })

    it('every second and different seconds', () => {
        time.triggers(Scenario).time.every('second')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/1 * * * * *', expect.anything())

        time.triggers(Scenario).time.every('1 second')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/1 * * * * *', expect.anything())

        time.triggers(Scenario).time.every('10 seconds')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/10 * * * * *', expect.anything())

        time.triggers(Scenario).time.every('60 sec')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/60 * * * * *', expect.anything())

        expect(Scenario.assert).toHaveBeenCalledTimes(4)
    })

    it('every minute and different minutes', () => {
        time.triggers(Scenario).time.every('minute')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */1 * * * *', expect.anything())

        time.triggers(Scenario).time.every('1 minute')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */1 * * * *', expect.anything())

        time.triggers(Scenario).time.every('10 minutes')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */10 * * * *', expect.anything())

        time.triggers(Scenario).time.every('60 mins')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */60 * * * *', expect.anything())

        expect(Scenario.assert).toHaveBeenCalledTimes(4)
    })

    it('every hour and different hours', () => {
        time.triggers(Scenario).time.every('hour')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */1 * * *', expect.anything())

        time.triggers(Scenario).time.every('1 hr')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */1 * * *', expect.anything())

        time.triggers(Scenario).time.every('10 hour')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */10 * * *', expect.anything())

        time.triggers(Scenario).time.every('60 hours')
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */60 * * *', expect.anything())

        expect(Scenario.assert).toHaveBeenCalledTimes(4)
    })

    it('throws an error if the time is no valid', () => {
        expect(() => time.triggers(Scenario).time.every('1hou')).toThrow(Error)
        expect(() => time.triggers(Scenario).time.every('1 minz')).toThrow(Error)
        expect(() => time.triggers(Scenario).time.every('1')).toThrow(Error)
        expect(() => time.triggers(Scenario).time.every('minz')).toThrow(Error)

        expect(Scenario.assert).not.toHaveBeenCalled()
    })
})

describe('Solar Time functionality', () => {
    let time
    let SunCalc

    beforeEach(() => {
        SunCalc = require('suncalc')
        schedule.scheduleJob = jest.fn()
        time = new TimeComponent(Fluent)
        jest.clearAllMocks()
    })

    afterEach(() => {
        mockdate.reset()
    })

    describe('Solar time setup', () => {
        it('sets up solar schedules on initialization', () => {
            // The constructor should call _setupSolarSchedules which schedules daily recalculation
            expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 * * *', expect.anything())
        })

        it('has default location coordinates', () => {
            expect(time.location).toBeDefined()
            expect(time.location.latitude).toBe(13.7563) // Bangkok latitude
            expect(time.location.longitude).toBe(100.5018) // Bangkok longitude
        })
    })

    describe('getSolarTimes', () => {
        it('returns solar times for current date', () => {
            const solarTimes = time.getSolarTimes()
            
            expect(SunCalc.getTimes).toHaveBeenCalledWith(
                expect.any(Date),
                time.location.latitude,
                time.location.longitude
            )
            expect(solarTimes).toHaveProperty('sunrise')
            expect(solarTimes).toHaveProperty('sunset')
            expect(solarTimes).toHaveProperty('dawn')
            expect(solarTimes).toHaveProperty('dusk')
        })
    })

    describe('getSolarTime', () => {
        it('returns specific solar time', () => {
            const sunrise = time.getSolarTime('sunrise')
            expect(sunrise).toEqual(new Date('2000-11-22T06:30:00'))
        })

        it('returns null for invalid solar event', () => {
            const invalid = time.getSolarTime('invalidEvent')
            expect(invalid).toBeNull()
        })
    })

    describe('_isSolarTime', () => {
        it('returns true for valid solar times', () => {
            expect(time._isSolarTime('sunrise')).toBe(true)
            expect(time._isSolarTime('sunset')).toBe(true)
            expect(time._isSolarTime('dawn')).toBe(true)
            expect(time._isSolarTime('dusk')).toBe(true)
            expect(time._isSolarTime('nauticalDawn')).toBe(true)
            expect(time._isSolarTime('nauticalDusk')).toBe(true)
            expect(time._isSolarTime('nightEnd')).toBe(true)
            expect(time._isSolarTime('night')).toBe(true)
            expect(time._isSolarTime('goldenHour')).toBe(true)
            expect(time._isSolarTime('goldenHourEnd')).toBe(true)
        })

        it('returns false for invalid solar times', () => {
            expect(time._isSolarTime('noon')).toBe(false)
            expect(time._isSolarTime('midnight')).toBe(false)
            expect(time._isSolarTime('invalid')).toBe(false)
            expect(time._isSolarTime('12:00')).toBe(false)
        })

        it('is case insensitive', () => {
            expect(time._isSolarTime('SUNRISE')).toBe(true)
            expect(time._isSolarTime('SunSet')).toBe(true)
            expect(time._isSolarTime('DAWN')).toBe(true)
        })
    })

    describe('setLocation', () => {
        it('updates location coordinates', () => {
            const newLat = 40.7128
            const newLng = -74.0060
            
            time.setLocation(newLat, newLng)
            
            expect(time.location.latitude).toBe(newLat)
            expect(time.location.longitude).toBe(newLng)
        })
    })

    describe('isSolarTime', () => {
        it('returns true when current time matches solar time (within 1 minute)', () => {
            mockdate.set('2000-11-22T06:30:30') // 30 seconds after sunrise
            expect(time.isSolarTime('sunrise')).toBe(true)
        })

        it('returns false when current time does not match solar time', () => {
            mockdate.set('2000-11-22T12:00:00') // Noon
            expect(time.isSolarTime('sunrise')).toBe(false)
        })

        it('returns false for invalid solar event', () => {
            expect(time.isSolarTime('invalidEvent')).toBe(false)
        })
    })
})

describe('Solar Time triggers', () => {
    let Scenario
    let time

    beforeEach(() => {
        time = new TimeComponent(Fluent)
        Scenario = ComponentHelper.ScenarioAndEvent(time)
        schedule.scheduleJob = jest.fn()
        jest.clearAllMocks()
    })

    it('solar time event triggers for sunrise', () => {
        time.triggers(Scenario).time.is('sunrise')
        time.event().emit('solar', 'sunrise')
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('solar time event triggers for sunset', () => {
        time.triggers(Scenario).time.is('sunset')
        time.event().emit('solar', 'sunset')
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('different solar event does not trigger', () => {
        time.triggers(Scenario).time.is('sunrise')
        time.event().emit('solar', 'sunset')
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('regular time triggers still work with solar functionality', () => {
        time.triggers(Scenario).time.is('10:00')
        time.event().emit('time', '10:00')
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('throws error for invalid time format that is not solar time', () => {
        expect(() => time.triggers(Scenario).time.is('invalid:time')).toThrow(
            'Time "invalid:time" is not in the correct format of HH:mm or a valid solar time'
        )
    })

    it('accepts all valid solar times', () => {
        const solarTimes = ['sunrise', 'sunset', 'dawn', 'dusk', 'nauticalDawn', 'nauticalDusk', 'nightEnd', 'night', 'goldenHour', 'goldenHourEnd']
        
        solarTimes.forEach(solarTime => {
            expect(() => time.triggers(Scenario).time.is(solarTime)).not.toThrow()
        })
    })
})
