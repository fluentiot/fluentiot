const logger = require('./../../utils/logger')

/**
 * Properties
 * Static, configuration data with broader value range
 * 
 * @param {*} parent 
 * @param {*} name 
 * @returns 
 */
const PropertyDslMixin = (parent, name) => {
    return {
        property: {
            setup: (parent, defaultProperties, definedProperties) => {
                if (!parent.properties) {
                    parent.properties = {}
                }

                const merged =
                    definedProperties !== null && typeof definedProperties === 'object'
                        ? { ...defaultProperties, ...definedProperties }
                        : { ...defaultProperties }

                for (const key in merged) {
                    parent.property.set(key, merged[key])
                }
            },
            get: (propertyName) => {
                if (typeof parent.properties[propertyName] === 'undefined') {
                    return null
                }
                return parent.properties[propertyName].value
            },
            set: (propertyName, propertyValue) => {
                parent.properties[propertyName] = { value: propertyValue }
                return true
            }
        },
    }
}

module.exports = {
    PropertyDslMixin,
}
