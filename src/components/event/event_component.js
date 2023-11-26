const EventEmitter = require('events');
const EventTriggers = require('./event_triggers');

/**
 * Component for managing system events.
 *
 * @extends Component
 * @class
 */
class EventComponent extends EventEmitter {

    /**
     * Constructor
     */
    constructor(Fluent) {
        super(Fluent);
        this.queueRunning = false;
        this.queue = [];
    }

    /**
     * Executes operations that should happen after the component has been loaded.
     * This method should be called once the component is ready to process events.
     */
    afterLoad() {
        this.queueRunning = true;
        this.processEventQueue();
    }

    /**
     * Emits an event and adds it to the event queue.
     *
     * @param {...any} args - Arguments to be passed to the event.
     */
    emit(...args) {
        this.queue.push(args);
        if(this.queueRunning) {
            this.processEventQueue();
        }
    }

    /**
     * Processes the event queue, triggering events that occurred before afterLoad was called.
     * This method is called automatically after afterLoad.
     */
    processEventQueue() {
        while (this.queue.length > 0) {
            const eventArgs = this.queue.shift();
            super.emit(...eventArgs);
        }
    }

    triggers(Scenario) {
        return {
            event: () => {
                return {
                    on: (eventName) => {
                        new EventTriggers(Scenario, this).on(eventName);
                        return Scenario.triggers;
                    }
                };
            }
        }
    }

}

module.exports = EventComponent;
