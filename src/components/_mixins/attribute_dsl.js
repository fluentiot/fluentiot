const logger = require('./../../utils/logger')

/**
 * Attributes
 * 
 * @param {*} parent 
 * @param {*} name 
 * @returns 
 */
const AttributeDslMixin = (parent, name) => {
    return {
        attribute: {
            setup: (parent, defaultAttributes, definedAttributes) => {
                if (!parent.attributes) {
                    parent.attributes = {}
                }

                const merged =
                    definedAttributes !== null && typeof definedAttributes === 'object'
                        ? { ...defaultAttributes, ...definedAttributes }
                        : { ...defaultAttributes }

                for (const key in merged) {
                    parent.attribute.set(key, merged[key])
                }
            },
            get: (attributeName) => {
                if (typeof parent.attributes[attributeName] === 'undefined') {
                    return null
                }
                return parent.attributes[attributeName]
            },
            set: (attributeName, attributeValue) => {
                parent.attributes[attributeName] = attributeValue
                return true
            },
            update: (attributeName, attributeValue) => {
                // Has the value changed?
                let changed = true
                if (parent.attributes[attributeName] === attributeValue) {
                    changed = false
                }

                // Set it
                parent.attributes[attributeName] = attributeValue

                logger.info(`Attribute, "${parent.name}" updated "${attributeName}" to "${attributeValue}"`, name)
                parent.parent.emit(`${name}.${parent.name}.attribute`, {
                    name: attributeName,
                    value: attributeValue,
                    changed
                })
            },
        },
    }
}

module.exports = {
    AttributeDslMixin,
}
