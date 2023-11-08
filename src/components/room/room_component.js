
const RoomTriggers = require('./room_triggers');
const Room = require('./room');

class RoomComponent {

    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');

        this.rooms = {};
    }

    add(name) {
        const newRoom = new Room(this.Event, name);
        this.rooms[name] = newRoom;
    }

    get(name) {
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
