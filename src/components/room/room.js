const moment = require('moment');
const logger = require('./../../utils/logger');

class Room {
    constructor(Event, name, attributes) {
        this.Event = Event;
        this.name = name;

        // Default attributes
        this.defaultAttributes = {
            occupied: false,
            occupiedStartTime: null,
            thresholdDuration: 15,      // Default threshold duration in minutes
        };

        // Use provided attributes if available, otherwise use default attributes
        this.attributes = attributes !== null && typeof attributes === 'object'
            ? { ...this.defaultAttributes, ...attributes }
            : { ...this.defaultAttributes };

        this.devices = [];

        // Set up the one-minute timer for checkOccupied
        this.checkOccupiedInterval = setInterval(() => this.checkOccupied(), 60 * 1000); // Every 1 minute
        this.checkOccupied();
    }

    updateOccupancyBySensor(sensorValue) {
        const now = moment();

        if (sensorValue) {
            // Sensor is true, room is now occupied
            this.attributes.occupiedStartTime = now;
            this.updateAttribute('occupied', true);
        }

        // Update the PIR sensor attribute
        this.setAttribute('_sensor', sensorValue);
    }

    checkOccupied() {
        const now = moment();

        // If the room is vacant, return early
        if (!this.attributes.occupied) {
            return;
        }

        // Pir sensor is in true, no need to check
        if (this.attributes._sensor === true) {
            return;
        }

        // Check if the room has been unoccupied for the threshold duration
        if (now.diff(this.attributes.occupiedStartTime, 'minutes') >= this.attributes.thresholdDuration) {
            // Now vacant
            this.attributes.occupiedStartTime = false;
            logger.debug(`${this.name} is now vacant.`, 'room');
            this.updateAttribute('occupied', false);
        } else {
            logger.debug(`${this.name} is still occupied.`, 'room');
        }
    }

    isOccupied() {
        return this.attributes.occupied;
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    updateAttribute(name, value) {
        if(this.attributes[name] === value) {
            return;
        }
        
        this.attributes[name] = value;
        logger.debug(`${this.name} set ${name} to "${value}"`, 'room');
        this.Event.emit(`room.${this.name}`, { name, value });
    }

    addDevice(device) {
        this.devices.push(device);
    }

}

module.exports = Room;
