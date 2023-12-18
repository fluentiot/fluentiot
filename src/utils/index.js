const reservedWords = [
    'const', 'let', 'var', 'function', 'if', 'else', 'while', 'for', 'return', 'import', 'export', 'prototype'
];

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

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getDotValue(obj, key) {
    const keys = key.split('.');
    let value = obj;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return null;
        }
    }

    return value;
}

module.exports = {
    isValidName,
    delay,
    getDotValue
}
