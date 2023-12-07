const dayjs = require('dayjs')
const logger = require('./../../utils/logger')
const { AttributeDslMixin } = require('./../_mixins/attribute_dsl')

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
        this.parent = parent
        this.name = name

        //Mixins
        Object.assign(this, AttributeDslMixin(this, 'room'))

        //Attributes
        const defaultAttributes = {
            occupied: false,
            occupiedStartTime: null,
            thresholdDuration: 15, // Default threshold duration in minutes
        }
        this.attribute.setup(this, defaultAttributes, attributes)

        // Last sensor time
        // For example each time a PIR sensor detects someone this variable will get updated
        // keeping the occupancy for the room
        this._sensorValue = null
        this._sensorLastTime = null

        // If default was occupied make sure the sensor is updated so _checkIfVacant does not
        // set the room immediately back to vacant
        if (this.attributes.occupied === true) {
            this.updatePresence(true)
        }

        // Set up the one-minute timer for checkOccupied
        this.checkOccupiedTimer = setInterval(() => this._checkIfVacant(), 60 * 1000) // Every 1 minute
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
            this._sensorLastTime = dayjs()
            if (!this.attribute.get('occupied')) {
                logger.info(`Room "${this.name}" is now occupied.`, 'room')
                this.attribute.update('occupied', true)
            }
        }

        // Update the PIR sensor attribute
        this._sensorValue = sensorValue

        // If no threshold duration for vacany then need to trigger occupied=false quickly
        // rather than waiting for the 1 minute timer
        if (this.attribute.get('thresholdDuration') <= 0) {
            this._checkIfVacant()
        }
    }

    /**
     * Check if vacant
     *
     * @private
     */
    _checkIfVacant() {
        // If the room is vacant, return early
        if (!this.attribute.get('occupied')) {
            return
        }

        // Sensor is true, no need to check
        if (this._sensorValue === true) {
            return
        }

        // Room sensor is false and under the threshold to set the room to vacant
        const now = dayjs()
        if (now.diff(this._sensorLastTime, 'minutes') < this.attribute.get('thresholdDuration')) {
            return
        }

        // Room is now vacant if passed early returns
        this._sensorLastTime = false
        logger.info(`Room "${this.name}" is now vacant.`, 'room')
        this.attribute.update('occupied', false)
    }

    /**
     * Is occupied
     *
     * @returns {Boolean} - if room is occupied
     */
    isOccupied() {
        return this.attribute.get('occupied')
    }

    /**
     * Is vacant
     *
     * @returns {Boolean} - if room is vacant
     */
    isVacant() {
        return !this.attribute.get('occupied')
    }
}

module.exports = Room
