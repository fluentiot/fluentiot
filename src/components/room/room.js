const dayjs = require('dayjs')
const logger = require('./../../logger');
const { datetime } = require('./../../utils')
const { AttributeDslMixin } = require('./../_mixins/attribute_dsl');

/**
 * Room
 *
 * @class
 */
class Room {

    /**
     * Room in the system with specific attributes.
     *
     * @param {object} parent - The parent object to which this device belongs.
     * @param {string} name - The name of the device.
     * @param {object} [attributes={}] - The attributes associated with the device.
     */
    constructor(parent, name, attributes) {
        this.parent = parent;
        this.name = name;

        // Mixins
        Object.assign(this, AttributeDslMixin(this, 'room'));

        // Handle vacancyDelay

        // Default attributes
        const defaultAttributes = {
            occupied: false,
            occupiedStartTime: null,
            vacancyDelay: 15,      // Default threshold duration in minutes
        };
        this.attribute.setup(defaultAttributes, attributes);

        // Vacancy delay
        if (typeof this.attribute.get('vacancyDelay') !== 'number') {
            this.vacancyDelay(this.attribute.get('vacancyDelay'))
        }

        // Last sensor time
        // For example each time a PIR sensor detects someone this variable will get updated
        // keeping the occupancy for the room
        this._sensorValue = null;
        this._sensorLastTime = null;

        // If default was occupied make sure the sensor is updated so _checkIfVacant does not
        // set the room immediately back to vacant
        if (this.attributes.occupied === true) {
            this.updatePresence(true);
        }

        // Set up the one-minute timer for _checkIfVacant
        this.checkOccupiedTimer = setInterval(() => this._checkIfVacant(), 60 * 1000); // Every 1 minute
    }


    /**
     * Vacancy delay
     * 
     * @param {string} duration 
     * @returns {boolean}
     */
    vacancyDelay(duration) {
        const parsed = datetime.getDurationInMinutes(duration)
        if (parsed === false) {
            throw new Error(`Invalid duration "${duration}" passed to vacancyDelay`)
        }
        this.attribute.set('vacancyDelay', parsed)
        return true
    }

    /**
     * Update the occupancy by sensor value
     * 
     * @param {Boolean} sensorValue - If occupied then true, if no detection then false
     */
    updatePresence(sensorValue) {
        // Sensor is true, room is occupied
        // Only trigger the occupied if wasn't previous occupied
        if (sensorValue) {
            this._sensorLastTime = dayjs();
            if (!this.attribute.get('occupied')) {
                logger.info(`Room "${this.name}" is now occupied.`, 'room');
                this.attribute.update('occupied', true);
            }
        }

        // Update the PIR sensor attribute
        this._sensorValue = sensorValue;

        // If no threshold duration for vacany then need to trigger occupied=false quickly
        // rather than waiting for the 1 minute timer
        if (!sensorValue && this.attribute.get('vacancyDelay') <= 0) {
            this._checkIfVacant();
        }
    }

    /**
     * Add presence sensor
     * 
     * @param {Device} device - Device object
     * @param {string} expectedKey - Sensor key/code to detect on
     * @param {string} expectedValue - Sensor value to detect on
     */
    addPresenceSensor(device, expectedKey, expectedValue) {
        this.parent.event().on(`device.${device.name}.attribute`, (data) => {
            // Not the right event
            if (data.name !== expectedKey) {
                return
            }

            // By default the sensor is not detecting presence
            // If the expected key and value is detected then there is presence
            let presence = false
            if(data.value === expectedValue) {
                presence = true
            }

            this.updatePresence(presence)
        });
    }

    /**
     * Check if vacant
     * 
     * @private 
     */
    _checkIfVacant() {
        // If the room is vacant, return early
        if (!this.attribute.get('occupied')) {
            return;
        }

        // Sensor is true, no need to check
        if (this._sensorValue === true) {
            return;
        }

        // Room sensor is false and under the threshold to set the room to vacant
        const now = dayjs();
        if (now.diff(this._sensorLastTime, 'minutes') < this.attribute.get('vacancyDelay')) {
            return;
        }

        // Room is now vacant if passed early returns
        this._sensorLastTime = false;
        logger.info(`Room "${this.name}" is now vacant.`, 'room');
        this.attribute.update('occupied', false);
    }

    /**
     * Set to occupied or vacant
     * 
     * @param {Boolean} occupied - if occupied or not
     */
    occupied(value) {
        this.attribute.update('occupied', value);
    }

    /**
     * Is occupied
     * 
     * @returns {Boolean} - if room is occupied
     */
    isOccupied() {
        return this.attribute.get('occupied');
    }

    /**
     * Is vacant
     * 
     * @returns {Boolean} - if room is vacant
     */
    isVacant() {
        return !this.attribute.get('occupied');
    }

    /**
     * Describe the room with its name and status
     * 
     * @returns {object} Description object with name and status
     */
    describe() {
        const description = {
            name: this.name,
            type: 'room',
            occupied: this.isOccupied(),
            attributes: this.attributes,
            occupancyStatus: this.isOccupied() ? 'occupied' : 'vacant'
        }
        
        return description
    }

}

module.exports = Room;
