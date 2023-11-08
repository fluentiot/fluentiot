
class EventTriggers {
    
    constructor(Scenario, Event) {
        this.Scenario = Scenario;
        this.Event = Event;
    }


    on(eventName) {
        const handler = () => {
            this.Scenario.assert(eventName);
        };
        this.Event.on(eventName, handler);
        return this;
    }
    
}

module.exports = EventTriggers;
