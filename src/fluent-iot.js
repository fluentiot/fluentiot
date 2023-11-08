/**
 * Fluent IoT - The Programmers IoT Framework
 */
const Fluent = require('./fluent/fluent.js');

// Dynamically load components from the ./components/ directory
const components = Fluent.loadComponents('./src/components');

// Combine components and Scenario in the export
module.exports = {
    Fluent,
    scenario: (description) => {
        return Fluent.createScenario(description)
    },
    ...components
};
