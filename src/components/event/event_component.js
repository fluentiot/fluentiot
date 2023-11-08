const EventEmitter = require('events');
const EventTriggers = require('./event_triggers');

class EventComponent extends EventEmitter {

    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');
    }

    emit(...args) {
        super.emit(...args);
    }

    triggers(Scenario) {
        return {
            event: () => {
                return {
                    on: (eventName) => {
                        new EventTriggers(Scenario, this.Event).on(eventName);
                        return Scenario.triggers;
                    }
                };
            }
        }
    }

}

module.exports = EventComponent;
