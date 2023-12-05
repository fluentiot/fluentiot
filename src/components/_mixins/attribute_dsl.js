
const logger = require('./../../utils/logger');

const AttributeDslMixin = (parent, name) => {

    return {
        attribute: {
            get: (attributeName) => {
                if (typeof parent.attributes[attributeName] === 'undefined') {
                    return null;
                }
                return parent.attributes[attributeName];
            },
            set: (attributeName, attributeValue) => {
                parent.attributes[attributeName] = attributeValue;
                return true;
            },
            update: (attributeName, attributeValue) => {
                if (parent.attributes[attributeName] === attributeValue) {
                    return;
                }
                parent.attributes[attributeName] = attributeValue;
                logger.info(`Attribute, set "${attributeName}" to "${attributeValue}"`, parent.name);
                parent.parent.emit(`${name}.${parent.name}.attribute`, { name:attributeName, value:attributeValue });
            }
        }
    }

}

module.exports = {
    AttributeDslMixin
};
