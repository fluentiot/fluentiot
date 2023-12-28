const datetime = require('./../../../src/utils/datetime')

describe('addDurationToNow function', () => {
    test('should add seconds to current date', () => {
        const result = datetime.addDurationToNow('5 seconds');
        const expected = new Date().getTime() + 5 * 1000; // Adding 5 seconds

        expect(result.valueOf()).toBeGreaterThanOrEqual(expected - 1000);
        expect(result.valueOf()).toBeLessThanOrEqual(expected + 1000);
    });

    test('should add minutes to current date', () => {
        const result = datetime.addDurationToNow('3 minutes');
        const expected = new Date().getTime() + 3 * 60 * 1000; // Adding 3 minutes

        expect(result.valueOf()).toBeGreaterThanOrEqual(expected - 1000);
        expect(result.valueOf()).toBeLessThanOrEqual(expected + 1000);
    });

    test('should add hours to current date', () => {
        const result = datetime.addDurationToNow('2 hours');
        const expected = new Date().getTime() + 2 * 60 * 60 * 1000; // Adding 2 hours

        expect(result.valueOf()).toBeGreaterThanOrEqual(expected - 1000);
        expect(result.valueOf()).toBeLessThanOrEqual(expected + 1000);
    });

    test('should throw an error for an invalid duration format', () => {
        expect(() => datetime.addDurationToNow('invalid')).toThrow('Invalid duration format');
    });

    test('should throw an error for an invalid duration format', () => {
        expect(() => datetime.addDurationToNow('5 invalid')).toThrow('Invalid duration format');
    });
});
