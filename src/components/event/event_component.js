const EventEmitter = require('events')
const Component = require('./../component')

/**
 * Fluent Emitter
 *
 * @extends EventEmitter
 */
class FluentEmitter extends EventEmitter {}

/**
 * Event component
 *
 * @extends Component
 * @class
 */
class EventComponent extends Component {
    
    /**
     * Constructor
     *
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent)

        this.queueRunning = false
        this.queue = []

        // Setup emitter
        this.emitter = new FluentEmitter()

        // Typically not advised but framework is event based, may need to revisit this
        this.emitter.setMaxListeners(100)

        // Abstract on method
        this.on = this.emitter.on.bind(this.emitter)
    }

    /**
     * Executes operations that should happen after the component has been loaded.
     * This method should be called once framework is ready to process events.
     */
    afterLoad() {
        this.queueRunning = true
        this.processEventQueue()
    }

    /**
     * Emits an event and adds it to the event queue.
     *
     * @param {...any} args - Arguments to be passed to the event.
     */
    emit(...args) {
        this.queue.push(args)
        if (this.queueRunning) {
            this.processEventQueue()
        }
    }

    /**
     * Processes the event queue, triggering events that occurred before afterLoad was called.
     * This method is called automatically after afterLoad.
     */
    processEventQueue() {
        while (this.queue.length > 0) {
            const eventArgs = this.queue.shift()
            this.emitter.emit(...eventArgs)
        }
    }

    /**
     * Defines triggers related to events for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(scope) {
        return {
            event: (eventName) => {
                return {
                    on: (eventValue) => {
                        this.on(eventName, (...args) => {
                            // If eventValue is defined, only trigger if it matches
                            if (eventValue && eventValue !== args[0]) {
                                return
                            }
                            scope.assert(...args)
                        })
                        return scope
                    },
                }
            },
        }
    }
}

module.exports = EventComponent
