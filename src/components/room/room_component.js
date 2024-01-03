const Component = require('./../component')
const Room = require('./room')
const logger = require('./../../utils/logger')
const Expect = require('./../../utils/expect')
const { validation } = require('./../../utils')
const { QueryDslMixin } = require('./../_mixins/query_dsl')

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

        // Mixins
        Object.assign(this, QueryDslMixin(this, this.rooms))
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
        if (!validation.isValidName(name)) {
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
     * @returns {object} - An object with constraint methods
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
                    },
                    attribute: (attributeName) => {
                        return new Expect(() => room.attribute.get(attributeName))
                    },
                }
            },
        }
    }

}

module.exports = RoomComponent
