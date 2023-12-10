const logger = require('./../../utils/logger')

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
                return parent.attributes[attributeName].value
            },
            set: (attributeName, attributeValue) => {
                parent.attributes[attributeName] = { value: attributeValue }
                return true
            },
            update: (attributeName, attributeValue) => {
                // Do not allow double setting
                if (
                    (!parent.attributes.stateful || parent.attributes.stateful.value === true) &&
                    parent.attributes[attributeName] && 
                    parent.attributes[attributeName].value === attributeValue) {
                    return
                }

                // Make sure it's defined if not already
                if (!parent.attributes[attributeName]) {
                    parent.attributes[attributeName] = {}
                }

                //Set it
                parent.attributes[attributeName].value = attributeValue

                logger.info(`Attribute, set "${attributeName}" to "${attributeValue}"`, name)
                parent.parent.emit(`${name}.${parent.name}.attribute`, {
                    name: attributeName,
                    value: attributeValue,
                })
            },
        },
    }
}

module.exports = {
    AttributeDslMixin,
}
