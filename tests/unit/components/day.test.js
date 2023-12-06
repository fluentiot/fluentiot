
const schedule = require('node-schedule');
schedule.scheduleJob = jest.fn();

const moment = require('moment');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const DayComponent = require('./../../../src/components/datetime/day_component');
const Fluent = require('./../../../src/fluent');


describe('Day constraints for "day is"', () => {
    
    let day;
    beforeEach(() => {
        schedule.scheduleJob = jest.fn();
        day = new DayComponent(Fluent);
    });

    it('day is today', () => {
        const fullDayName = moment().format('dddd');
        const abbreviatedDayName = moment().format('ddd');
        expect(day.constraints().day.is(fullDayName)()).toBe(true);
        expect(day.constraints().day.is(abbreviatedDayName)()).toBe(true);
    });

    it('is supports multiple days', () => {
        const fullDayName = moment().format('dddd');
        const tomorrowDayName = moment().add(1, 'days').format('dddd');
        const result = day.constraints().day.is([fullDayName, tomorrowDayName])();
        expect(result).toBe(true);
    });

    it('supports weekend and weekdays', () => {
        expect(day.constraints().day.is(['weekday', 'weekend'])()).toBe(true);
    });

    it('is negative if not today', () => {
        const tomorrowDayName = moment().add(1, 'days').format('dddd');
        const result = day.constraints().day.is(tomorrowDayName)();
        expect(result).toBe(false);
    });

    it('fails if the passed date is unknown', () => {
        const result = day.constraints().day.is('zzz')();
        expect(result).toBe(false);
    });

    it('fails if the passed date is a number', () => {
        const result = day.constraints().day.is(111)();
        expect(result).toBe(false);
    });

});


