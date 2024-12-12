const schedule = require('node-schedule')
schedule.scheduleJob = jest.fn()

const mockdate = require('mockdate')
const dayjs = require('dayjs')
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/logger')

const DayComponent = require('./../../../src/components/datetime/day_component')
const Fluent = require('./../../../src/fluent')

describe('Day parsing and between methods', () => {
    let day
    beforeEach(() => {
        day = new DayComponent(Fluent)
    })

    it('handles valid date inputs', () => {
        expect(day.parseDate('2023-01-01').isValid()).toBe(true);
        expect(day.parseDate('5th May').isValid()).toBe(true);
        expect(day.parseDate('5 May').isValid()).toBe(true);
        expect(day.parseDate('May 5th').isValid()).toBe(true);
        expect(day.parseDate('May 5').isValid()).toBe(true);
        expect(day.parseDate('2023-12-31').isValid()).toBe(true);
        expect(day.parseDate('January 15').isValid()).toBe(true);
        expect(day.parseDate('2023-12-31').isValid()).toBe(true);
        expect(day.parseDate('12/31/2023').isValid()).toBe(true);
        expect(day.parseDate('31 Dec 2023').isValid()).toBe(true);
        expect(day.parseDate('Dec 31 2023').isValid()).toBe(true);
        expect(day.parseDate('1st December').isValid()).toBe(true);
        expect(day.parseDate('31st December').isValid()).toBe(true);
    });

    it('handles invalid date inputs', () => {
        expect(day.parseDate('2023-45-01')).toBe(false) // Invalid day
        expect(day.parseDate('2023-01-45')).toBe(false) // Invalid month
        expect(day.parseDate('2023-01-01T25:00:00')).toBe(false) // Invalid hour
        expect(day.parseDate('2023-01-01T12:60:00')).toBe(false) // Invalid minute
        expect(day.parseDate('2023-01-01T12:00:60')).toBe(false) // Invalid second
        expect(day.parseDate('Not a date')).toBe(false)
        expect(day.parseDate('2023')).toBe(false) // Missing month and day
        expect(day.parseDate('2023-01')).toBe(false) // Missing day
        expect(day.parseDate('5th')).toBe(false) // Missing month and year
    })

    it('does not throw on valid date formats', () => {
        expect(day.isCurrentDateInRange('2023-01-01', '2023-01-02')).toBeDefined()
        expect(day.isCurrentDateInRange('5th May', '8th May')).toBeDefined()
        expect(day.isCurrentDateInRange('5 May', '8 May')).toBeDefined()
        expect(day.isCurrentDateInRange('May 5th', 'May 10th')).toBeDefined()
        expect(day.isCurrentDateInRange('May 5', 'May 10')).toBeDefined()
    })

    it('throws error if dates are invalid', () => {
        expect(() => day.isCurrentDateInRange('xx', '2023-01-02')).toThrow()
        expect(() => day.isCurrentDateInRange('2023-01-01', 'xx')).toThrow()
        expect(() => day.isCurrentDateInRange('xx', 'xx')).toThrow()

        expect(() => day.isCurrentDateInRange('', '2023-01-02')).toThrow()
        expect(() => day.isCurrentDateInRange('2023-01-01', '')).toThrow()
        expect(() => day.isCurrentDateInRange('', '')).toThrow()
    })

    it('is between today and tomorrow', () => {
        const start = dayjs().format('MMMM D')
        const end = dayjs().add(1, 'days').format('MMMM D')
        expect(day.isCurrentDateInRange(start, end)).toBe(true)
    })

    it('is between yesterday and tomorrow', () => {
        const start = dayjs().subtract(1, 'days').format('MMMM D YYYY')
        const end = dayjs().add(1, 'days').format('MMMM D YYYY')
        expect(day.isCurrentDateInRange(start, end)).toBe(true)
    })

    it('is NOT tomorrow', () => {
        const start = dayjs().add(1, 'days').format('MMMM D')
        const end = dayjs().add(2, 'days').format('MMMM D')
        expect(day.isCurrentDateInRange(start, end)).toBe(false)
    })

    it('is NOT before', () => {
        const start = dayjs().subtract(2, 'days').format('MMMM D')
        const end = dayjs().subtract(1, 'days').format('MMMM D')
        expect(day.isCurrentDateInRange(start, end)).toBe(false)
    })

    it('is handling exact dates', () => {
        const start1 = dayjs().format('YYYY-MM-DD')
        const end1 = dayjs().add(1, 'days').format('YYYY-MM-DD')
        expect(day.isCurrentDateInRange(start1, end1)).toBe(true)

        const start2 = dayjs().add(1, 'days').format('YYYY-MM-DD')
        const end2 = dayjs().add(2, 'days').format('YYYY-MM-DD')
        expect(day.isCurrentDateInRange(start2, end2)).toBe(false)
    })
})

describe('Day is', () => {
    let day
    beforeEach(() => {
        day = new DayComponent(Fluent)
    })


    it('day is today', () => {
        const fullDayName = dayjs().format('dddd')
        const abbreviatedDayName = dayjs().format('ddd')

        expect(day.is(fullDayName)).toBe(true)
        expect(day.is(abbreviatedDayName)).toBe(true)
    })

    it('is supports multiple days', () => {
        const fullDayName = dayjs().format('dddd')
        const tomorrowDayName = dayjs().add(1, 'days').format('dddd')
        const result = day.is([fullDayName, tomorrowDayName])
        expect(result).toBe(true)
    })

    it('supports weekend and weekdays', () => {
        expect(day.is(['weekday', 'weekend'])).toBe(true)
    })

    it('is negative if not today', () => {
        const tomorrowDayName = dayjs().add(1, 'days').format('dddd')
        const result = day.is(tomorrowDayName)
        expect(result).toBe(false)
    })

    it('fails if the passed date is unknown', () => {
        const result = day.is('zzz')
        expect(result).toBe(false)
    })

    it('fails if the passed date is a number', () => {
        const result = day.constraints().day.is(111)()
        expect(result).toBe(false)
    })
});


describe('Day is between', () => {
    let day
    beforeEach(() => {
        day = new DayComponent(Fluent)
    })

    it('is between today', () => {
        const start = dayjs().format('MMMM D')
        const end = dayjs().add(1, 'days').format('MMMM D')
        expect(day.between(start, end)).toBe(true)
    })

    it('is not between today', () => {
        const start = dayjs().add(1, 'days').format('MMMM D')
        const end = dayjs().add(2, 'days').format('MMMM D')
        expect(day.between(start, end)).toBe(false)
    })

    it('returns false if the input is a bad format', () => {
        const start = 'xxx'
        const end = dayjs().add(2, 'days').format('MMMM D')
        expect(day.between(start, end)).toBe(false)
    })
})


describe('Day constraints for "between"', () => {
    let day
    beforeEach(() => {
        day = new DayComponent(Fluent)
        mockdate.reset()
    })

    it('is between today', () => {
        const start = dayjs().format('MMMM D')
        const end = dayjs().add(1, 'days').format('MMMM D')
        expect(day.constraints().day.between(start, end)()).toBe(true)
    })

    it('is not between today', () => {
        const start = dayjs().add(1, 'days').format('MMMM D')
        const end = dayjs().add(2, 'days').format('MMMM D')
        expect(day.constraints().day.between(start, end)()).toBe(false)
    })

    it('returns false if the input is a bad format', () => {
        const start = 'xxx'
        const end = dayjs().add(2, 'days').format('MMMM D')
        expect(day.constraints().day.between(start, end)()).toBe(false)
    })

    it('is between dates in December', () => {
        mockdate.set('2023-11-30 12:30:00');
        const result1 = day.constraints().day.between('December 1st', 'December 31st')()
        expect(result1).toBe(false)

        mockdate.set('2023-12-30 12:30:00');
        const result2 = day.constraints().day.between('December 1st', 'December 31st')()
        expect(result2).toBe(true)

        mockdate.set('2024-01-01 12:30:00');
        const result3 = day.constraints().day.between('December 1st', 'December 31st')()
        expect(result3).toBe(false)
    })
})

describe('Day constraints for "day is"', () => {
    let day
    beforeEach(() => {
        schedule.scheduleJob = jest.fn()
        day = new DayComponent(Fluent)
    })

    it('day is today', () => {
        const fullDayName = dayjs().format('dddd')
        const abbreviatedDayName = dayjs().format('ddd')

        expect(day.constraints().day.is(fullDayName)()).toBe(true)
        expect(day.constraints().day.is(abbreviatedDayName)()).toBe(true)
    })

    it('is supports multiple days', () => {
        const fullDayName = dayjs().format('dddd')
        const tomorrowDayName = dayjs().add(1, 'days').format('dddd')
        const result = day.constraints().day.is([fullDayName, tomorrowDayName])()
        expect(result).toBe(true)
    })

    it('supports weekend and weekdays', () => {
        expect(day.constraints().day.is(['weekday', 'weekend'])()).toBe(true)
    })

    it('is negative if not today', () => {
        const tomorrowDayName = dayjs().add(1, 'days').format('dddd')
        const result = day.constraints().day.is(tomorrowDayName)()
        expect(result).toBe(false)
    })

    it('fails if the passed date is unknown', () => {
        const result = day.constraints().day.is('zzz')()
        expect(result).toBe(false)
    })

    it('fails if the passed date is a number', () => {
        const result = day.constraints().day.is(111)()
        expect(result).toBe(false)
    })
})
