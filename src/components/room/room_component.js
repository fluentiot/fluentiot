const Component = require('./../component');
const Room = require('./room');
const logger = require('./../../utils/logger');

/**
 * Room component
 *
 * @extends Component
 * @class
 */
class RoomComponent extends Component {

    /**
     * Constructor
     */
    constructor(Fluent) {
        super(Fluent);
        this.rooms = {};
    }

    /**
     * Adds a new room
     * @param {string} name - The name of the room.
     * @param {Object} attributes - Attributes for the room.
     * @returns {Room} - The room object.
     */
    add(name, attributes) {
        if(this.rooms[name]) {
            logger.error('Name already exists', 'room');
            return false;
        }
        const newRoom = new Room(this, name, attributes);
        this.rooms[name] = newRoom;
        return newRoom;
    }

    /**
     * Retrieves a room by its name.
     * @param {string} name - The name of the room.
     * @returns {*} - The room object or false if the room was not found by the name.
     */
    get(name) {
        if(!this.rooms[name]) {
            return false;
        }
        const room = this.rooms[name];
        return room;
    }

    /**
     * Defines triggers related to room for a given Scenario.
     *
     * @param {Scenario} Scenario - The Scenario object.
     * @returns {object} - An object with trigger methods for devices.
     */
    triggers(Scenario) {
        return {
            room: (name) => {
                const room = this.get(name);
                if(!room) {
                    throw new Error(`Room ${name} does not exist`, 'room');
                }

                return {
                    is: {
                        occupied: () => { 
                            this.event().on(`room.${room.name}`, (changedData) => {
                                if(changedData.name === 'occupied' && changedData.value === true) {
                                    Scenario.assert();
                                }
                            });
                            return Scenario.triggers;
                        },
                        vacant: () => { 
                            this.event().on(`room.${room.name}`, (changedData) => {
                                if(changedData.name === 'occupied' && changedData.value === false) {
                                    Scenario.assert();
                                }
                            });
                            return Scenario.triggers;
                        },
                    }
                };
            },
        }
    }
    
}

module.exports = RoomComponent;
