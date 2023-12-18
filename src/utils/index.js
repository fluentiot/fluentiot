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

module.exports = {
    isValidName,
    delay
}
