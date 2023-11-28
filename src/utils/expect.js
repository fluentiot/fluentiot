
class Expect {

    constructor(value) {
        this.value = value;
        this.negate = false;

        //Aliases
        this.is = this.toBe;
        this.isDefined = this.toBeDefined;
        this.isUndefined = this.toBeUndefined;
        this.isFalsy = this.toBeFalsy;
        this.isTruthy = this.toBeTruthy;
        this.isNull = this.toBeNull;
        this.isNaN = this.toBeNaN;
        this.contain = this.toContain;
        this.equal = this.toEqual;
        this.match = this.toMatch;
    }
  
    get not() {
        const notInstance = new Expect(this.value);
        notInstance.negate = true;
        return notInstance;
    }
    
    toBe(expected) {
        const result = this.value === expected;
        return this.negate ? !result : result;
    }
  
    toBeDefined() {
        const result = typeof this.value !== 'undefined';
        return this.negate ? !result : result;
    }
  
    toBeUndefined() {
        const result = typeof this.value === 'undefined';
        return this.negate ? !result : result;
    }
  
    toBeFalsy() {
        const result = !this.value;
        return this.negate ? !result : result;
    }
  
    toBeTruthy() {
        const result = Boolean(this.value);
        return this.negate ? !result : result;
    }
  
    toBeNull() {
        const result = this.value === null;
        return this.negate ? !result : result;
    }
  
    toBeNaN() {
        const result = isNaN(this.value);
        return this.negate ? !result : result;
    }
  
    toContain(expected) {
        const result = this.value.includes(expected);
        return this.negate ? !result : result;
    }
  
    toEqual(expected) {
        const result = deepEqual(this.value, expected);
        return this.negate ? !result : result;
    }
  
    toMatch(pattern) {
        const result = pattern.test(this.value);
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
  