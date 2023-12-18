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

module.exports = getDotValue