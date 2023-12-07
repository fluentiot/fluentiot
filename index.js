/**
 * Fluent IoT - The Programmers IoT Framework
 */
const Fluent = require('./src/fluent')
const logger = require('./src/utils/logger')
const components = Fluent.component().all()

// Combine components and Scenario in the export
module.exports = {
    Fluent,
    logger,
    scenario: (description) => {
        return Fluent.scenario().create(description)
    },
    ...components,
}
