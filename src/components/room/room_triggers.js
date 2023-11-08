class RoomTriggers {

    constructor(Scenario, Event) {
        this.Scenario = Scenario;
        this.Event = Event;

        //Saved arguments
        this.occupiedForCondition = null;

        //Validations
        this.allowedValues = {
            operators: ['<', '>', '<=', '>=', '='],
            units: ['minute', 'minutes', 'min', 'mins', 'm', 'hour', 'hours', 'hr', 'hrs', 'h']
        }
    }


    occupied(room) {
        this.Event.on(`room.${room.name}`, (changedData) => {
            if(changedData.name === 'occupied' && changedData.value === true) {
                this.Scenario.assert();
            }
        });
        return this;
    }

    vacant(room) {
        this.Event.on(`room.${room.name}`, (changedData) => {
            if(changedData.name === 'occupied' && changedData.value === false) {
                this.Scenario.assert();
            }
        });
        return this;
    }

    occupiedFor(room, ...args) {
        // '5', 'minutes' (default operator will be '=')
        // '>', '5', 'minutes'
        // '>=', '5', 'minutes'
        // '<', '5', 'minutes'
        // '<=', '5', 'minutes'
        // '>', '1', 'hour'

        const operator = args.length > 2 ? args[0] : '=';
        const value = args.length > 2 ? args[1] : args[0];
        const unit = args.length > 2 ? args[2] : args[1];

        //Validate operator
        if(!this.allowedValues.operators.includes(operator)) {
            throw new Error(`Invalid operator '${operator}'. Allowed operators: ${this.allowedValues.operators.join(', ')}`);
        }

        //Validate unit
        if(!this.allowedValues.units.includes(unit)) {
            throw new Error(`Invalid unit '${unit}'. Allowed units: ${this.allowedValues.units.join(', ')}`);
        }

        //Validate value
        if(!Number.isInteger(Number(value))) {
            throw new Error(`Value must be a numeric integer`);
        }

        //Store for checking
        this.occupiedForCondition = { operator, value, unit };
        
        // Every minute check the state
        this.Event.on('datetime.minute', () => {
            const occupiedStartTime = room.attributes.occupiedStartTime;
            if (this.checkOccupiedForCondition(occupiedStartTime)) {
                this.Scenario.assert(this.occupiedForCondition);
            }
        });

        return this;
    }


    checkOccupiedForCondition(occupiedStartTime) {
        if (!occupiedStartTime || !this.occupiedForCondition) {
            return false;
        }

        const { operator, value, unit } = this.occupiedForCondition;
        const now = Date.now(); // Current timestamp in milliseconds
        const durationInMillis = this.convertToMilliseconds(value, unit);

        switch (operator) {
            case '=':
                return now - occupiedStartTime >= durationInMillis;
            case '>':
                return now - occupiedStartTime > durationInMillis;
            case '>=':
                return now - occupiedStartTime >= durationInMillis;
            case '<':
                return now - occupiedStartTime < durationInMillis;
            case '<=':
                return now - occupiedStartTime <= durationInMillis;
            default:
                return false; // Invalid operator
        }
    }

    convertToMilliseconds(value, unit) {
        switch (unit.toLowerCase()) {
            case 'm':
            case 'min':
            case 'mins':
            case 'minute':
            case 'minutes':
                return value * 60 * 1000; // Convert minutes to milliseconds
            case 'h':
            case 'hr':
            case 'hrs':
            case 'hour':
            case 'hours':
                return value * 60 * 60 * 1000; // Convert hours to milliseconds
            default:
                return 0; // Invalid unit
        }
    }


}

module.exports = RoomTriggers;
