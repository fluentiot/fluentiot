const Component = require('./../component')
const Room = require('./room')
const logger = require('./../../utils/logger')
const { isValidName } = require('./../../utils')

/**
 * Room component
 *
 * @extends Component
 * @class
 */
class RoomComponent extends Component {

    /**
     * Constructor
     *
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent)
        this.rooms = {}
    }

    /**
     * Adds a new room
     *
     * @param {string} name - The name of the room.
     * @param {Object} attributes - Attributes for the room.
     * @returns {Room} - The room object.
     */
    add(name, attributes) {
        if (this.rooms[name]) {
            throw new Error(`Room with the name "${name}" already exists`)
        }
        if (!isValidName(name)) {
            throw new Error(`Room name "${name} is not valid`);
        }
        this.rooms[name] = new Room(this, name, attributes)
        return this.rooms[name]
    }

    /**
     * Retrieves a room by its name.
     *
     * @param {string} name - The name of the room.
     * @returns {any|null} - Returns the room.
     */
    get(name) {
        if (!this.rooms[name]) {
            logger.error(`Room "${name}" could not be found`, 'room')
            return null
        }
        return this.rooms[name]
    }

    /**
     * Defines triggers related to room for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(scope) {
        return {
            room: (name) => {
                const room = this.get(name)
                if (!room) {
                    throw new Error(`Room ${name} does not exist`, 'room')
                }

                return {
                    isOccupied: () => {
                        this.event().on(`room.${room.name}.attribute`, (changedData) => {
                            if (changedData.name === 'occupied' && changedData.value === true) {
                                scope.assert()
                            }
                        })
                        return scope
                    },
                    isVacant: () => {
                        this.event().on(`room.${room.name}.attribute`, (changedData) => {
                            if (changedData.name === 'occupied' && changedData.value === false) {
                                scope.assert()
                            }
                        })
                        return scope
                    },
                }
            },
        }
    }

    /**
     * Defines constraints related to room.
     *
     * @returns {object} - An object with constraint methods for datetime.
     */
    constraints() {
        return {
            room: (name) => {
                const room = this.get(name)
                if (!room) {
                    throw new Error(`Room "${name}" does not exist`, 'room')
                }
                
                return {
                    isOccupied: () => {
                        return () => {
                            return room.isOccupied();
                        }
                    },
                    isVacant: () => {
                        return () => {
                            return room.isVacant();
                        }
                    }
                }
            },
        }
    }

}

module.exports = RoomComponent
