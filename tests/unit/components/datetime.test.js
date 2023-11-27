
const schedule = require('node-schedule');
const moment = require('moment');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const DatetimeComponent = require('./../../../src/components/datetime/datetime_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');



describe('Datetime setup', () => {

    beforeEach(() => {
        schedule.scheduleJob = jest.fn();
    });

    it('has setup scheduler', () => {
        new DatetimeComponent(Fluent);
        expect(schedule.scheduleJob).toHaveBeenCalledTimes(3);
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(1, '*/1 * * * *', expect.anything());
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(2, '0 * * * *', expect.anything());
        expect(schedule.scheduleJob).toHaveBeenNthCalledWith(3, '* * * * * *', expect.anything());
    });

});


describe('Datetime constraints', () => {
    
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

    it('is negative if not today', () => {
        const tomorrowDayName = moment().add(1, 'days').format('dddd');
        const result = datetime.constraints().day.is(tomorrowDayName);
        expect(result).toBe(false);
    });

});


describe('Datetime triggers', () => {


});
