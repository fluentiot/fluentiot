
const Expect = require('./../../../src/utils/expect');

let fexpect;

beforeEach(() => {
    fexpect = (value) => new Expect(value);
});


describe('Expect return type', () => {

    it('return normal', () => {
        const expectNormal = (value) => new Expect(value);
        expect(expectNormal('foo').toBe('foo')).toBe(true);
    });

    it('return callback', () => {
        const callback = () => { return 'foo'; }
        const expectNormal = (value) => new Expect(callback);
        expect(typeof expectNormal('foo').toBe('foo')).toBe('function');
        expect(expectNormal('foo').toBe('foo')()).toBe(true);
    });

});


describe('Expect methods', () => {

    it('toBe and not', () => {
        expect(fexpect('foo').toBe('foo')).toBe(true);
        expect(fexpect('foo').toBe('bar')).toBe(false);

        expect(fexpect('foo').not.toBe('bar')).toBe(true);
        expect(fexpect('foo').not.toBe('foo')).toBe(false);
    });

    it('toBeDefined', () => {
        expect(fexpect('foo').toBeDefined()).toBe(true);
        expect(fexpect(undefined).toBeDefined()).toBe(false);

        expect(fexpect(undefined).not.toBeDefined()).toBe(true);
    });

    it('toBeUndefined', () => {
        expect(fexpect(undefined).toBeUndefined()).toBe(true);
        expect(fexpect('foo').toBeUndefined()).toBe(false);
        expect(fexpect('foo').not.toBeUndefined()).toBe(true);
    });

    it('toBeFalsy', () => {
        expect(fexpect(false).toBeFalsy()).toBe(true);
        expect(fexpect(0).toBeFalsy()).toBe(true);
        expect(fexpect('').toBeFalsy()).toBe(true);
        expect(fexpect(null).toBeFalsy()).toBe(true);
        expect(fexpect(undefined).toBeFalsy()).toBe(true);
        expect(fexpect(NaN).toBeFalsy()).toBe(true);

        expect(fexpect(true).toBeFalsy()).toBe(false);
        expect(fexpect(' ').toBeFalsy()).toBe(false);
        expect(fexpect('foo').toBeFalsy()).toBe(false);
        expect(fexpect(1).toBeFalsy()).toBe(false);
        expect(fexpect(123).toBeFalsy()).toBe(false);
        expect(fexpect(53.45).toBeFalsy()).toBe(false);
        expect(fexpect(new Object).toBeFalsy()).toBe(false);

        expect(fexpect(false).not.toBeFalsy()).toBe(false);
    });

    it('toBeTruthy', () => {
        expect(fexpect(true).toBeTruthy()).toBe(true);
        expect(fexpect(' ').toBeTruthy()).toBe(true);
        expect(fexpect('foo').toBeTruthy()).toBe(true);
        expect(fexpect(1).toBeTruthy()).toBe(true);
        expect(fexpect(123).toBeTruthy()).toBe(true);
        expect(fexpect(53.45).toBeTruthy()).toBe(true);
        expect(fexpect(new Object).toBeTruthy()).toBe(true);

        expect(fexpect(false).toBeTruthy()).toBe(false);
        expect(fexpect(0).toBeTruthy()).toBe(false);
        expect(fexpect('').toBeTruthy()).toBe(false);
        expect(fexpect(null).toBeTruthy()).toBe(false);
        expect(fexpect(undefined).toBeTruthy()).toBe(false);
        expect(fexpect(NaN).toBeTruthy()).toBe(false);

        expect(fexpect(true).not.toBeTruthy()).toBe(false);
    });

    it('toBeNull', () => {
        const foobar = null;
        expect(fexpect(foobar).toBeNull()).toBe(true);
        expect(fexpect(null).toBeNull()).toBe(true);

        expect(fexpect('foobar').toBeNull()).toBe(false);
        expect(fexpect('foobar').not.toBeNull()).toBe(true);
    });

    it('toBeNaN', () => {
        const foobar = NaN;
        expect(fexpect(foobar).toBeNaN()).toBe(true);
        expect(fexpect(NaN).toBeNaN()).toBe(true);

        expect(fexpect('hey').not.toBeNaN()).toBe(false);
    });

    it('toContain', () => {
        expect(fexpect(['a','b','c']).toContain('a')).toBe(true);
        expect(fexpect(['a','b','c']).toContain('d')).toBe(false);

        const obj1 = new Object();
        const obj2 = new Object();
        const obj3 = new Object();
        expect(fexpect([obj1, obj2]).toContain(obj1)).toBe(true);
        expect(fexpect([obj1, obj2]).toContain(obj3)).toBe(false);

        expect(fexpect(['a','b','c']).not.toContain('d')).toBe(true);
    });

    it('toEqual', () => {
        const result1 = fexpect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
        expect(result1).toBe(true);

        const result2 = fexpect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
        expect(result2).not.toBe(false);

        const result3 = fexpect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [5, 6] });
        expect(result3).toBe(false);
    });

    it('toMatch', () => {
        const result1 = fexpect('hello123').toMatch(/[a-z]+\d+/);
        expect(result1).toBe(true);

        const result2 = fexpect('123world').toMatch(/[a-z]+\d+/);
        expect(result2).toBe(false);

        const result3 = fexpect('123world').toMatch(/[a-z]+\d+/);
        expect(result3).not.toBe(true);
    });

    it('toBeGreaterThan', () => {
        expect(fexpect(10).toBeGreaterThan(9)).toBe(true);
        expect(fexpect(10).toBeGreaterThan(11)).toBe(false);

        expect(fexpect(10).toBeGreaterThan(9)).not.toBe(false);
    });

    it('toBeGreaterThanOrEqual', () => {
        expect(fexpect(10).toBeGreaterThanOrEqual(9)).toBe(true);
        expect(fexpect(10).toBeGreaterThanOrEqual(10)).toBe(true);

        expect(fexpect(10).toBeGreaterThanOrEqual(11)).toBe(false);

        expect(fexpect(10).not.toBeGreaterThanOrEqual(9)).toBe(false);
    });

    it('toBeLessThan', () => {
        expect(fexpect(10).toBeLessThan(15)).toBe(true);
        expect(fexpect(10).toBeLessThan(8)).toBe(false);

        expect(fexpect(10).not.toBeLessThan(15)).toBe(false);
    });

    it('toBeLessThanOrEqual', () => {
        expect(fexpect(15).toBeLessThanOrEqual(15)).toBe(true);
        expect(fexpect(5).toBeLessThanOrEqual(10)).toBe(true);
        expect(fexpect(10).toBeLessThanOrEqual(5)).toBe(false);

        expect(fexpect(15).not.toBeLessThanOrEqual(15)).toBe(false);
    });

});

describe('Expect constraints with aliases', () => {

    it('is', () => {
        expect(fexpect('foo').is('foo')).toBe(true);
    });

    it('isDefined', () => {
        expect(fexpect('foo').isDefined()).toBe(true);
    });

    it('isUndefined', () => {
        expect(fexpect(undefined).isUndefined()).toBe(true);
    });

    it('isFalsy', () => {
        expect(fexpect(false).isFalsy()).toBe(true);
    });

    it('isTruthy', () => {
        expect(fexpect(true).isTruthy()).toBe(true);
    });

    it('isNull', () => {
        expect(fexpect(null).isNull()).toBe(true);
    });

    it('isNaN', () => {
        expect(fexpect(NaN).isNaN()).toBe(true);
    });

    it('contain', () => {
        expect(fexpect(['a','b','c']).contain('a')).toBe(true);
    });

    it('equal', () => {
        const result1 = fexpect({ a: 1, b: [2, 3] }).equal({ a: 1, b: [2, 3] });
        expect(result1).toBe(true);
    });

    it('match', () => {
        const result1 = fexpect('hello123').match(/[a-z]+\d+/);
        expect(result1).toBe(true);
    });

    it('isGreaterThan', () => {
        expect(fexpect(10).isGreaterThan(9)).toBe(true);
    });

    it('isGreaterThanOrEqual', () => {
        expect(fexpect(10).isGreaterThanOrEqual(9)).toBe(true);
    });

    it('isLessThan', () => {
        expect(fexpect(10).isLessThan(15)).toBe(true);
    });

    it('isLessThanOrEqual', () => {
        expect(fexpect(15).isLessThanOrEqual(15)).toBe(true);
    });

});