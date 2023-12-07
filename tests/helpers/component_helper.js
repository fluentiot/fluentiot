const EventEmitter = require('events')

const ScenarioAndEvent = (parent) => {
    ScenarioObject = new Object()
    ScenarioObject.assert = jest.fn()
    ScenarioObject.triggers = jest.fn()

    class CustomEmitter extends EventEmitter {}
    const event = new CustomEmitter()

    parent.event = jest.fn(() => {
        return event
    })

    return ScenarioObject
}

module.exports = {
    ScenarioAndEvent,
}
