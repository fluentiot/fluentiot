/**
 * Fluent IoT - The Programmers IoT Framework
 */
const Fluent = require('./src/fluent')
const logger = require('./src/commons/logger')
const utils = require('./src/utils')
const components = Fluent.component.list()

// Scenario
function scenario(description, properties = {}) {
    return Fluent.scenario.add(description, properties);
}

// Define "only" version of describe
scenario.only = (description, properties = {}) => {
    properties.only = true
    return scenario(description, properties)
}


// Combine components and Scenario in the export
module.exports = {
    Fluent,
    logger,
    scenario,
    ...components,
    utils
}
