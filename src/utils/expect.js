/**
 * Expect utility
 *
 * @class
 */
class Expect {
    /**
     * Constructor
     */
    constructor(value) {
        this.value = value
        this.negate = false
        this.valueCallback = null

        //Move value and callback so it can be reused
        if (typeof this.value === 'function') {
            this.valueCallback = this.value
            this.value = null
        }

        const methods = [
            { method: 'toBe', alias: 'is' },
            { method: 'toBeDefined', alias: 'isDefined' },
            { method: 'toBeUndefined', alias: 'isUndefined' },
            { method: 'toBeFalsy', alias: 'isFalsy' },
            { method: 'toBeTruthy', alias: 'isTruthy' },
            { method: 'toBeNull', alias: 'isNull' },
            { method: 'toBeNaN', alias: 'isNaN' },
            { method: 'toBeGreaterThan', alias: 'isGreaterThan' },
            { method: 'toBeGreaterThanOrEqual', alias: 'isGreaterThanOrEqual' },
            { method: 'toBeLessThan', alias: 'isLessThan' },
            { method: 'toBeLessThanOrEqual', alias: 'isLessThanOrEqual' },
            { method: 'toContain', alias: 'contain' },
            { method: 'toEqual', alias: 'equal' },
            { method: 'toMatch', alias: 'match' },
        ]

        if (this.valueCallback) {
            //Map each method as a nested. Return will be a function that can be called later.
            for (const element of methods) {
                const nested = (...args) => {
                    return () => {
                        this.value = this.valueCallback()
                        return this['_' + element.method](...args)
                    }
                }
                this[element.method] = nested
                this[element.alias] = nested
            }
        } else {
            //Direct mapping including alias
            for (const element of methods) {
                this[element.method] = this['_' + element.method]
                this[element.alias] = this['_' + element.method]
            }
        }
    }

    /**
     * Negates the matching
     */
    get not() {
        const notInstance = new Expect(this.value, this.returnDirect)
        notInstance.negate = true
        return notInstance
    }

    /**
     * Checks if the value is equal to the expected value.
     *
     * @param {*} expected - The expected value for comparison.
     * @returns {boolean} - True if the value is equal to the expected value; false otherwise.
     */
    _toBe(expected) {
        const result = this.value === expected
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is defined.
     *
     * @returns {boolean} - True if the value is defined; false otherwise.
     */
    _toBeDefined() {
        const result = typeof this.value !== 'undefined'
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is undefined.
     *
     * @returns {boolean} - True if the value is undefined; false otherwise.
     */
    _toBeUndefined() {
        const result = typeof this.value === 'undefined'
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is falsy.
     *
     * @returns {boolean} - True if the value is falsy; false otherwise.
     */
    _toBeFalsy() {
        const result = !this.value
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is truthy.
     *
     * @returns {boolean} - True if the value is truthy; false otherwise.
     */
    _toBeTruthy() {
        const result = Boolean(this.value)
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is null.
     *
     * @returns {boolean} - True if the value is null; false otherwise.
     */
    _toBeNull() {
        const result = this.value === null
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is NaN.
     *
     * @returns {boolean} - True if the value is NaN; false otherwise.
     */
    _toBeNaN() {
        const result = isNaN(this.value)
        return this.negate ? !result : result
    }

    /**
     * Checks if the value contains the expected value.
     *
     * @param {*} expected - The value to check for inclusion.
     * @returns {boolean} - True if the value contains the expected value; false otherwise.
     */
    _toContain(expected) {
        const result = this.value.includes(expected)
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is deeply equal to the expected value.
     *
     * @param {*} expected - The expected value for deep equality comparison.
     * @returns {boolean} - True if the value is deeply equal to the expected value; false otherwise.
     */
    _toEqual(expected) {
        const result = deepEqual(this.value, expected)
        return this.negate ? !result : result
    }

    /**
     * Checks if the value matches the specified pattern.
     *
     * @param {RegExp} pattern - The regular expression pattern to match against the value.
     * @returns {boolean} - True if the value matches the pattern; false otherwise.
     */
    _toMatch(pattern) {
        const result = pattern.test(this.value)
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is greater than the specified number.
     *
     * @param {number} number - The number to compare against.
     * @returns {boolean} - True if the value is greater than the specified number; false otherwise.
     */
    _toBeGreaterThan(number) {
        const result = this.value > number
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is greater than or equal to the specified number.
     *
     * @param {number} number - The number to compare against.
     * @returns {boolean} - True if the value is greater than or equal to the specified number; false otherwise.
     */
    _toBeGreaterThanOrEqual(number) {
        const result = this.value >= number
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is less than the specified number.
     *
     * @param {number} number - The number to compare against.
     * @returns {boolean} - True if the value is less than the specified number; false otherwise.
     */
    _toBeLessThan(number) {
        const result = this.value < number
        return this.negate ? !result : result
    }

    /**
     * Checks if the value is less than or equal to the specified number.
     *
     * @param {number} number - The number to compare against.
     * @returns {boolean} - True if the value is less than or equal to the specified number; false otherwise.
     */
    _toBeLessThanOrEqual(number) {
        const result = this.value <= number
        return this.negate ? !result : result
    }
}

/**
 * Helper function for deep equality comparison between two values.
 *
 * @param {*} a - The first value for comparison.
 * @param {*} b - The second value for comparison.
 * @returns {boolean} - True if the values are deeply equal; false otherwise.
 */
function deepEqual(a, b) {
    if (a === b) return true

    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false
    }

    return true
}

module.exports = Expect
