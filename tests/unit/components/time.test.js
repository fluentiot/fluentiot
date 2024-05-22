const schedule = require('node-schedule')
schedule.scheduleJob = jest.fn()

const mockdate = require('mockdate')
const dayjs = require('dayjs')
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/commons/logger')


const TimeComponent = require('./../../../src/components/datetime/time_component')
const Fluent = require('./../../../src/fluent')
const ComponentHelper = require('./../../helpers/component_helper.js')

describe('Time setup', () => {
    it('has setup scheduler', () => {
        new TimeComponent(Fluent)
        expect(schedule.scheduleJob).toHaveBeenCalledTimes(3)
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(1, '*/1 * * * *', expect.anything())
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(2, '0 * * * *', expect.anything())
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(3, '* * * * * *', expect.anything())
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
