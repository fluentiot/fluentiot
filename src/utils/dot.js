class dot {
    static get(data, key) {
        const keys = key.split('.');
        
        function recursiveLookup(obj, keys) {
            const currentKey = keys.shift();
            
            console.log('Current Key:', currentKey);

            if (obj && typeof obj === 'object' && currentKey in obj) {
                const nextObj = obj[currentKey];

                // If the next object is a non-object, return it
                if (!keys.length && typeof nextObj !== 'object') {
                    console.log('Found:', nextObj);
                    return nextObj;
                }

                return recursiveLookup(nextObj, keys);
            } else {
                console.log('Not Found');
                return null;
            }
        }

        return recursiveLookup(data, keys);
    }
}

module.exports = dot;
