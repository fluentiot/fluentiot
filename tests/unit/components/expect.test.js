
const ExpectComponent = require('./../../../src/components/expect/expect_component');
const Fluent = require('./../../../src/fluent');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

let fexpect;

beforeEach(() => {
    fexpect = new ExpectComponent(Fluent);
});


describe('Expect constraints', () => {

    it('toBe and not', () => {
        expect(fexpect.constraints().expect('foo').toBe('foo')).toBe(true);
        expect(fexpect.constraints().expect('foo').toBe('bar')).toBe(false);

        expect(fexpect.constraints().expect('foo').not.toBe('bar')).toBe(true);
        expect(fexpect.constraints().expect('foo').not.toBe('foo')).toBe(false);
    });

    it('toBeDefined', () => {
        expect(fexpect.constraints().expect('foo').toBeDefined()).toBe(true);
        expect(fexpect.constraints().expect(undefined).toBeDefined()).toBe(false);
    });

    it('toBeUndefined', () => {
        expect(fexpect.constraints().expect(undefined).toBeUndefined()).toBe(true);
        expect(fexpect.constraints().expect('foo').toBeUndefined()).toBe(false);
        expect(fexpect.constraints().expect('foo').not.toBeUndefined()).toBe(true);
    });

    it('toBeFalsy', () => {
        expect(fexpect.constraints().expect(false).toBeFalsy()).toBe(true);
        expect(fexpect.constraints().expect(0).toBeFalsy()).toBe(true);
        expect(fexpect.constraints().expect('').toBeFalsy()).toBe(true);
        expect(fexpect.constraints().expect(null).toBeFalsy()).toBe(true);
        expect(fexpect.constraints().expect(undefined).toBeFalsy()).toBe(true);
        expect(fexpect.constraints().expect(NaN).toBeFalsy()).toBe(true);

        expect(fexpect.constraints().expect(true).toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect(' ').toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect('foo').toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect(1).toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect(123).toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect(53.45).toBeFalsy()).toBe(false);
        expect(fexpect.constraints().expect(new Object).toBeFalsy()).toBe(false);
    });

    it('toBeTruthy', () => {
        expect(fexpect.constraints().expect(true).toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect(' ').toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect('foo').toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect(1).toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect(123).toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect(53.45).toBeTruthy()).toBe(true);
        expect(fexpect.constraints().expect(new Object).toBeTruthy()).toBe(true);

        expect(fexpect.constraints().expect(false).toBeTruthy()).toBe(false);
        expect(fexpect.constraints().expect(0).toBeTruthy()).toBe(false);
        expect(fexpect.constraints().expect('').toBeTruthy()).toBe(false);
        expect(fexpect.constraints().expect(null).toBeTruthy()).toBe(false);
        expect(fexpect.constraints().expect(undefined).toBeTruthy()).toBe(false);
        expect(fexpect.constraints().expect(NaN).toBeTruthy()).toBe(false);
    });

    it('toBeNull', () => {
        const foobar = null;
        expect(fexpect.constraints().expect(foobar).toBeNull()).toBe(true);
        expect(fexpect.constraints().expect(null).toBeNull()).toBe(true);

        expect(fexpect.constraints().expect('foobar').toBeNull()).toBe(false);
        expect(fexpect.constraints().expect('foobar').not.toBeNull()).toBe(true);
    });

    it('toBeNaN', () => {
        const foobar = NaN;
        expect(fexpect.constraints().expect(foobar).toBeNaN()).toBe(true);
        expect(fexpect.constraints().expect(NaN).toBeNaN()).toBe(true);

        expect(fexpect.constraints().expect('hey').not.toBeNaN()).toBe(false);
    });

    it('toContain', () => {
        expect(fexpect.constraints().expect(['a','b','c']).toContain('a')).toBe(true);
        expect(fexpect.constraints().expect(['a','b','c']).toContain('d')).toBe(false);

        const obj1 = new Object();
        const obj2 = new Object();
        const obj3 = new Object();
        expect(fexpect.constraints().expect([obj1, obj2]).toContain(obj1)).toBe(true);
        expect(fexpect.constraints().expect([obj1, obj2]).toContain(obj3)).toBe(false);
    });

    it('toEqual', () => {
        const result1 = fexpect.constraints().expect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
        expect(result1).toBe(true);

        const result2 = fexpect.constraints().expect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [5, 6] });
        expect(result2).toBe(false);
    });

    it('toMatch', () => {
        const result1 = fexpect.constraints().expect('hello123').toMatch(/[a-z]+\d+/);
        expect(result1).toBe(true);

        const result2 = fexpect.constraints().expect('123world').toMatch(/[a-z]+\d+/);
        expect(result2).toBe(false);
    });

});



describe('Expect constraints with aliases', () => {

    it('is', () => {
        expect(fexpect.constraints().expect('foo').is('foo')).toBe(true);
    });

    it('isDefined', () => {
        expect(fexpect.constraints().expect('foo').isDefined()).toBe(true);
    });

    it('isUndefined', () => {
        expect(fexpect.constraints().expect(undefined).isUndefined()).toBe(true);
    });

    it('isFalsy', () => {
        expect(fexpect.constraints().expect(false).isFalsy()).toBe(true);
    });

    it('isTruthy', () => {
        expect(fexpect.constraints().expect(true).isTruthy()).toBe(true);
    });

    it('isNull', () => {
        expect(fexpect.constraints().expect(null).isNull()).toBe(true);
    });

    it('isNaN', () => {
        expect(fexpect.constraints().expect(NaN).isNaN()).toBe(true);
    });

    it('contain', () => {
        expect(fexpect.constraints().expect(['a','b','c']).contain('a')).toBe(true);
    });

    it('equal', () => {
        const result1 = fexpect.constraints().expect({ a: 1, b: [2, 3] }).equal({ a: 1, b: [2, 3] });
        expect(result1).toBe(true);
    });

    it('match', () => {
        const result1 = fexpect.constraints().expect('hello123').match(/[a-z]+\d+/);
        expect(result1).toBe(true);
    });

});
