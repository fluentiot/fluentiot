const logger = require('./../../utils/logger')
const Expect = require('./../../utils/expect')

const setupAttributes = (parent, defaultAttributes, definedAttributes) => {
  if (!parent.attributes) {
    parent.attributes = {};
  }

  const merged =
    definedAttributes !== null && typeof definedAttributes === 'object'
      ? { ...defaultAttributes, ...definedAttributes }
      : { ...defaultAttributes };

  for (const key in merged) {
    parent.attributes[key] = {
      value: merged[key],
      changed: true,
    };
  }
};

const getAttribute = (parent, attributeName) => {
  const attribute = parent.attributes[attributeName];

  if (typeof attribute === 'undefined') {
    return null;
  }

  return attribute.value;
};

const setAttribute = (parent, attributeName, attributeValue) => {
  parent.attributes[attributeName] = {
    value: attributeValue,
    changed: true,
  };
  return true;
};

const updateAttribute = (parent, attributeName, attributeValue, name) => {
  // Has the value changed?
  let changed = true;
  if (parent.attributes[attributeName]?.value === attributeValue) {
    changed = false;
  }

  // Set it
  parent.attributes[attributeName] ??= {};
  parent.attributes[attributeName].value = attributeValue;

  logger.info(`Attribute, "${parent.name}" updated "${attributeName}" to "${attributeValue}"`, name);
  parent.parent.emit(`${name}.${parent.name}.attribute`, {
    name: attributeName,
    value: attributeValue,
    changed,
  });
};

const expectAttribute = (parent, attributeName) => {
  const attribute = getAttribute(parent, attributeName)
  return new Expect(attribute)
};

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
      setup: (defaultAttributes, definedAttributes) => {
        setupAttributes(parent, defaultAttributes, definedAttributes);
      },
      get: (attributeName) => {
        return getAttribute(parent, attributeName);
      },
      expect: (attributeName) => {
        return expectAttribute(parent, attributeName);
      },
      set: (attributeName, attributeValue) => {
        return setAttribute(parent, attributeName, attributeValue);
      },
      update: (attributeName, attributeValue) => {
        updateAttribute(parent, attributeName, attributeValue, name);
      },
    },
  };
};

module.exports = {
  AttributeDslMixin,
};
