
class DeviceTriggers {
    
    constructor(Scenario, Event) {
        this.Scenario = Scenario;
        this.Event = Event;
    }

    is(device, attributeName, attributeValue) {
        const handler = (changedData) => {
            if (changedData.name === attributeName && changedData.value === attributeValue) {
                this.Scenario.assert(device);
            }
        };
        this.Event.on(`device.${device.name}`, handler);
        return this;
    }

    changes(attributeName) {
        this.Event.on('variable', (changedData) => {
            if(changedData.name === attributeName) {
                this.Scenario.assert(changedData.value);
            }
        });
        return this;
    }
    
}

module.exports = DeviceTriggers;
