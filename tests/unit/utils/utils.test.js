const { isValidName } = require('./../../../src/utils')

beforeEach(() => {})

describe('isValidName', () => {

    it('returns true for good names', () => {
        expect(isValidName('foo')).toBe(true)
        expect(isValidName('fooBar')).toBe(true)
        expect(isValidName('camelCaseName')).toBe(true)
    })
    
    it('returns false for invalid names', () => {
        expect(isValidName('')).toBe(false)
        expect(isValidName('1')).toBe(false)
        expect(isValidName('with space')).toBe(false)
        expect(isValidName('Invalid_Camel_Case')).toBe(false)
        expect(isValidName('kebab-case')).toBe(false)
        expect(isValidName('snake_case')).toBe(false)
        expect(isValidName('123StartingWithNumber')).toBe(false)
        expect(isValidName('if')).toBe(false)
        expect(isValidName('const')).toBe(false)
    });

})