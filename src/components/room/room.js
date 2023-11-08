const moment = require('moment');

class Room {

    constructor(Event, name) {
        this.Event = Event;
        this.name = name;
        this.attributes = {
            occupied: false,
            occupiedStartTime: null,
            vacantStartTime: null
        };
        this.devices = [];
    }

    updateOccupied(value) {
        if(value && !this.attributes.occupied) {
            //Now occupied
            this.attributes.occupiedStartTime = moment();
        }
        else if (!value) {
            //Now vacant
            this.attributes.vacantStartTime = moment();
        }

        this.updateAttribute('occupied', value);

        return true;
    }

    isOccupied() {
        return this.attributes.occupied;
    }

    updateAttribute(name, value) {
        this.attributes[name] = value;
        this.Event.emit(`room.${this.name}`, { name, value });
    }

    addDevice(device) {
        this.devices.push(device);
    }
}

module.exports = Room;
