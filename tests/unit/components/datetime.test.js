
const schedule = require('node-schedule');
schedule.scheduleJob = jest.fn();

const moment = require('moment');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const DatetimeComponent = require('./../../../src/components/datetime/datetime_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');



describe('Datetime setup', () => {

    it('has setup scheduler', () => {
        new DatetimeComponent(Fluent);
        expect(schedule.scheduleJob).toHaveBeenCalledTimes(3);
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(1, '*/1 * * * *', expect.anything());
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(2, '0 * * * *', expect.anything());
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(3, '* * * * * *', expect.anything());
    });

});


describe('Datetime constraints for "day is"', () => {
    
    let datetime;
    beforeEach(() => {
        schedule.scheduleJob = jest.fn();
        datetime = new DatetimeComponent(Fluent);
    });

    it('day is today', () => {
        const fullDayName = moment().format('dddd');
        const abbreviatedDayName = moment().format('ddd');
        expect(datetime.constraints().day.is(fullDayName)).toBe(true);
        expect(datetime.constraints().day.is(abbreviatedDayName)).toBe(true);
    });

    it('is supports multiple days', () => {
        const fullDayName = moment().format('dddd');
        const tomorrowDayName = moment().add(1, 'days').format('dddd');
        const result = datetime.constraints().day.is([fullDayName, tomorrowDayName]);
        expect(result).toBe(true);
    });

    it('supports weekend and weekdays', () => {
        expect(datetime.constraints().day.is(['weekday', 'weekend'])).toBe(true);
    });

    it('is negative if not today', () => {
        const tomorrowDayName = moment().add(1, 'days').format('dddd');
        const result = datetime.constraints().day.is(tomorrowDayName);
        expect(result).toBe(false);
    });

    it('fails if the passed date is unknown', () => {
        const result = datetime.constraints().day.is('zzz');
        expect(result).toBe(false);
    });

    it('fails if the passed date is a number', () => {
        const result = datetime.constraints().day.is(111);
        expect(result).toBe(false);
    });

});



describe('Datetime constraints for "between"', () => {

    let datetime;
    beforeEach(() => {
        schedule.scheduleJob = jest.fn();
        datetime = new DatetimeComponent(Fluent);
    });

    it('between is true when between times', () => {
        const start = moment().clone().subtract(1, 'minute').format('HH:mm');
        const end = moment().clone().add(1, 'minute').format('HH:mm');
        expect(datetime.constraints().time.between(start, end)).toBe(true);
    });

    it('between is false when out of time', () => {
        const start = moment().clone().subtract(2, 'minute').format('HH:mm');
        const end = moment().clone().subtract(1, 'minute').format('HH:mm');
        expect(datetime.constraints().time.between(start, end)).toBe(false);
    });

    it('between is true when exactly now', () => {
        const start = moment().format('HH:mm');
        const end = moment().clone().add(1, 'minute').format('HH:mm');
        expect(datetime.constraints().time.between(start, end)).toBe(true);
    });

    it('between fails if the between start or end date is not valid', () => {
        const any = moment().format('HH:mm');
        expect(datetime.constraints().time.between('zz:aa', any)).toBe(false);
        expect(datetime.constraints().time.between(any, 'zz:aa')).toBe(false);
    });

});


describe('Datetime triggers', () => {

    let Scenario;
    let datetime;
    
    beforeEach(() => {
        datetime = new DatetimeComponent(Fluent);
        Scenario = ComponentHelper.ScenarioAndEvent(datetime);

        schedule.scheduleJob = jest.fn((schedule, callback) => {
            callback();
        });   
    });

    it('time event triggers', () => {
        datetime.triggers(Scenario).time.is('10:00');
        datetime.event().emit('datetime.time', '10:00');
        expect(Scenario.assert).toHaveBeenCalled();
    });

    it('different time event does not trigger', () => {
        datetime.triggers(Scenario).time.is('10:00');
        datetime.event().emit('datetime.time', '10:01');
        expect(Scenario.assert).not.toHaveBeenCalled();
    });

    it('every second and different seconds', () => {
        datetime.triggers(Scenario).time.every('second');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/1 * * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('1 second');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/1 * * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('10 seconds');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/10 * * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('60 sec');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('*/60 * * * * *', expect.anything());

        expect(Scenario.assert).toHaveBeenCalledTimes(4);
    });

    it('every minute and different minutes', () => {
        datetime.triggers(Scenario).time.every('minute');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */1 * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('1 minute');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */1 * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('10 minutes');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */10 * * * *', expect.anything());

        datetime.triggers(Scenario).time.every('60 mins');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 */60 * * * *', expect.anything());

        expect(Scenario.assert).toHaveBeenCalledTimes(4);
    });

    it('every hour and different hours', () => {
        datetime.triggers(Scenario).time.every('hour');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */1 * * *', expect.anything());

        datetime.triggers(Scenario).time.every('1 hr');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */1 * * *', expect.anything());

        datetime.triggers(Scenario).time.every('10 hour');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */10 * * *', expect.anything());

        datetime.triggers(Scenario).time.every('60 hours');
        expect(schedule.scheduleJob).toHaveBeenCalledWith('0 0 */60 * * *', expect.anything());

        expect(Scenario.assert).toHaveBeenCalledTimes(4);
    });

    it('throws an error if the time is no valid', () => {
        expect(() => datetime.triggers(Scenario).time.every('1hou')).toThrow(Error);
        expect(() => datetime.triggers(Scenario).time.every('1 minz')).toThrow(Error);
        expect(() => datetime.triggers(Scenario).time.every('1')).toThrow(Error);
        expect(() => datetime.triggers(Scenario).time.every('minz')).toThrow(Error);

        expect(Scenario.assert).not.toHaveBeenCalled();
    });

});