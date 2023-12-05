
class Expect {

    constructor(value) {
        this.value = value;
        this.negate = false;
        this.valueCallback = null;

        //Move value and callback so it can be reused
        if(typeof this.value === 'function') {
            this.valueCallback = this.value;
            this.value = null;
        }

        const methods = [
            { 'method': 'toBe', 'alias': 'is' },
            { 'method': 'toBeDefined', 'alias': 'isDefined' },
            { 'method': 'toBeUndefined', 'alias': 'isUndefined' },
            { 'method': 'toBeFalsy', 'alias': 'isFalsy' },
            { 'method': 'toBeTruthy', 'alias': 'isTruthy' },
            { 'method': 'toBeNull', 'alias': 'isNull' },
            { 'method': 'toBeNaN', 'alias': 'isNaN' },
            { 'method': 'toBeGreaterThan', 'alias': 'isGreaterThan' },
            { 'method': 'toBeGreaterThanOrEqual', 'alias': 'isGreaterThanOrEqual' },
            { 'method': 'toBeLessThan', 'alias': 'isLessThan' },
            { 'method': 'toBeLessThanOrEqual', 'alias': 'isLessThanOrEqual' },
            { 'method': 'toContain', 'alias': 'contain' },
            { 'method': 'toEqual', 'alias': 'equal' },
            { 'method': 'toMatch', 'alias': 'match' }
        ];

        if(this.valueCallback) {
            //Map each method as a nested. Return will be a function that can be called later.
            for(const element of methods) {
                const nested = (...args) => {
                    return () => {
                        this.value = this.valueCallback();
                        return this['_'+element.method](...args);
                    }
                };
                this[element.method] = nested;
                this[element.alias] = nested;
            }
        }
        else {
            //Direct mapping including alias
            for(const element of methods) {
                this[element.method] = this['_'+element.method];
                this[element.alias] = this['_'+element.method];
            }
        }

    }
  
    get not() {
        const notInstance = new Expect(this.value, this.returnDirect);
        notInstance.negate = true;
        return notInstance;
    }
    
    _toBe(expected) {
        const result = this.value === expected;
        return this.negate ? !result : result;
    }
  
    _toBeDefined() {
        const result = typeof this.value !== 'undefined';
        return this.negate ? !result : result;
    }
  
    _toBeUndefined() {
        const result = typeof this.value === 'undefined';
        return this.negate ? !result : result;
    }
  
    _toBeFalsy() {
        const result = !this.value;
        return this.negate ? !result : result;
    }
  
    _toBeTruthy() {
        const result = Boolean(this.value);
        return this.negate ? !result : result;
    }
  
    _toBeNull() {
        const result = this.value === null;
        return this.negate ? !result : result;
    }
  
    _toBeNaN() {
        const result = isNaN(this.value);
        return this.negate ? !result : result;
    }
  
    _toContain(expected) {
        const result = this.value.includes(expected);
        return this.negate ? !result : result;
    }
  
    _toEqual(expected) {
        const result = deepEqual(this.value, expected);
        return this.negate ? !result : result;
    }
  
    _toMatch(pattern) {
        const result = pattern.test(this.value);
        return this.negate ? !result : result;
    }
  
    _toBeGreaterThan(number) {
        const result = this.value > number;
        return this.negate ? !result : result;
    }
  
    _toBeGreaterThanOrEqual(number) {
        const result = this.value >= number;
        return this.negate ? !result : result;
    }
  
    _toBeLessThan(number) {
        const result = this.value < number;
        return this.negate ? !result : result;
    }
  
    _toBeLessThanOrEqual(number) {
        const result = this.value <= number;
        return this.negate ? !result : result;
    }

}

// Helper function for deep equality comparison
function deepEqual(a, b) {
    if (a === b) return true;

    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
}

module.exports = Expect;
  