
class VariableTriggers {
    
    constructor(Scenario, Event) {
        this.Scenario = Scenario;
        this.Event = Event;
    }

    is(variableName, targetValue) {
        const handler = (changedData) => {
            if (changedData.name === variableName && changedData.value === targetValue) {
                this.Scenario.assert();
            }
        };

        this.Event.on('variable', handler);

        return this;
    }

    changes(variableName) {
        this.Event.on('variable', (changedData) => {
            if(changedData.name === variableName) {
                this.Scenario.assert(changedData.value);
            }
        });
        return this;
    }
    
}

module.exports = VariableTriggers;
