const Component = require('./../component');
const RoomTriggers = require('./room_triggers');
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
        const newRoom = new Room(this.event(), name, attributes);
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

    triggers(Scenario) {
        return {
            room: (name) => {
                return {
                    isOccupied: () => { 
                        const room = this.get(name);
                        new RoomTriggers(Scenario, this.Event).occupied(room);
                        return Scenario.triggers;
                    },
                    isVacant: () => { 
                        const room = this.get(name);
                        new RoomTriggers(Scenario, this.Event).vacant(room);
                        return Scenario.triggers;
                    },
                    occupied: () => {
                        return {
                            is:(...args) => {
                                const room = this.get(name);
                                new RoomTriggers(Scenario, this.Event).occupiedFor(room, ...args);
                                return Scenario.triggers;
                            }
                        }
                    }
                };
            },
        }
    }
    
}

module.exports = RoomComponent;
