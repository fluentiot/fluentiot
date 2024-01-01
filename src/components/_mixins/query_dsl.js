
/**
 * Check if an element matches the query.
 * @param {object} element - The element to check.
 * @param {object} query - The query to match against.
 * @returns {boolean} - True if the element matches the query, false otherwise.
 */
const doesElementMatchQuery = (element, query) => {
    for (const field in query) {
        if (!element[field] || element[field] !== query[field]) {
            return false;
        }
    }
    return true;
};

/**
 * Find elements in the dataSource that match the query.
 * @param {string|object} collectionOrQuery - The collection name or query object.
 * @param {object} query - The query to match against (used only when collectionOrQuery is an object).
 * @returns {array} - An array of matching elements.
 */
const findElements = (dataSource, collectionOrQuery, query) => {
    const collection = typeof collectionOrQuery === 'string' ? collectionOrQuery : null;

    if (typeof collection === 'string' && !query) {
        if (dataSource[collection]) {
            return [ dataSource[collection] ]
        }
        return []
    }

    return Object.values(dataSource)
        .filter(element => {
            if (collection) {
                return element[collection] && doesElementMatchQuery(element[collection], query);
            } else {
                return doesElementMatchQuery(element, collectionOrQuery);
            }
        });
};

/**
 * Find DSL Mixin
 * 
 * @param {object} parent - The parent object to which this device belongs.
 * @param {object} dataSource - The data source to search for devices.
 * @returns {array|null|object} - An array of devices matching the attribute and value,
 */
const QueryDslMixin = (parent, dataSource) => {

    const getDataSource = () => {
        if (typeof dataSource === 'function') {
            return dataSource();
        }
        return dataSource;
    }

    return {
        find: (collectionOrQuery, query) => {
            const results = findElements(getDataSource(), collectionOrQuery, query);
            return results.length ? results : null;
        },
        get: (collectionOrQuery, query) => {
            const results = findElements(getDataSource(), collectionOrQuery, query);
            return results.length ? results[0] : null;
        },
        findOne: (collectionOrQuery, query) => {
            const results = findElements(getDataSource(), collectionOrQuery, query);
            return results.length ? results[0] : null;
        },
        count: () => {
            return Object.keys(getDataSource()).length
        },
        list: () => {
            if (Object.keys(getDataSource()).length === 0) {
                return null;
            }
            return getDataSource()
        }
    };
};

module.exports = {
    QueryDslMixin,
};
