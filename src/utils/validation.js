const reservedWords = [
    'const', 'let', 'var', 'function', 'if', 'else', 'while', 'for', 'return', 'import', 'export', 'prototype'
];

/**
 * Checks if the name is valid to fluentiot conventions
 * 
 * A valid name must:
 * - Start with a lowercase letter
 * - Contain only letters and numbers
 * - Not be a reserved word
 * - No spaces
 * 
 * Example of valid names: "foobar", "fooBar", "foo123"
 * Example of invalid names: "FooBar", "foo bar", "123foo"
 * 
 * @param {string} name - Name to check
 * @returns {boolean} - True if the name is valid; false otherwise
 */
function isValidName(name) {
    // Check if the name is in camelCase format
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
        return false;
    }

    // Check if the name is not a reserved word
    if (reservedWords.includes(name)) {
        return false;
    }

    return true;
}

module.exports = {
    isValidName
}