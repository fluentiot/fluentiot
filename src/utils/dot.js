class dot {
    static get(data, key) {
        // Check if key is a string before splitting
        const keys = typeof key === 'string' ? key.split('.') : [];

        function recursiveLookup(obj, keys) {
            const currentKey = keys.shift();

            if (obj && typeof obj === 'object') {
                // If the current key is undefined, return the entire object
                if (!currentKey) {
                    return obj;
                }

                if (currentKey in obj) {
                    const nextObj = obj[currentKey];

                    // If the next object is a non-object and there are no more keys, return it
                    if (!keys.length && typeof nextObj !== 'object') {
                        return nextObj;
                    }

                    return recursiveLookup(nextObj, keys);
                }
            }

            return null;
        }

        return recursiveLookup(data, keys);
    }
}

module.exports = dot;
