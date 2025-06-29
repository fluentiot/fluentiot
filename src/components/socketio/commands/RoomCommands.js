const BaseCommand = require('./BaseCommand');

/**
 * Room commands
 */
class RoomCommands extends BaseCommand {
    getCommands() {
        return {
            'room.list': this.listRooms.bind(this),
            'room.get': this.getRoom.bind(this)
        };
    }

    getCommandSuggestions() {
        return [
            'inspect room [name]'
        ];
    }

    listRooms(params) {
        try {
            const roomComponent = this.Fluent._component().get('room');
            if (roomComponent) {
                const rooms = roomComponent.rooms || {};
                const roomCount = Object.keys(rooms).length;
                this.logSuccess(`Room component found, rooms count: ${roomCount}`);
                
                // Create a safe, serializable version of the rooms
                const safeRooms = {};
                Object.keys(rooms).forEach(roomName => {
                    const room = rooms[roomName];
                    safeRooms[roomName] = {
                        name: room.name || roomName,
                        occupied: room.occupied || false,
                        devices: Array.isArray(room.devices) ? room.devices.map(d => d.name || d) : [],
                        type: room.type || 'room'
                    };
                });
                
                this.logSuccess(`Returning ${Object.keys(safeRooms).length} safe rooms`);
                return safeRooms;
            }
            this.logSuccess('Room component not available');
            return {};
        } catch (error) {
            return this.handleError('listing rooms', error);
        }
    }

    getRoom(params) {
        try {
            const { roomId, action } = params;
            const roomComponent = this.Fluent._component().get('room');
            if (roomComponent && roomComponent.get) {
                const room = roomComponent.get(roomId);
                if (!room) {
                    return { error: `Room "${roomId}" not found` };
                }
                
                // If action is 'describe', use the describe method
                if (action === 'describe' && typeof room.describe === 'function') {
                    return room.describe();
                }
                
                // Return basic room info without circular references
                return {
                    name: room.name || roomId,
                    occupied: room.isOccupied ? room.isOccupied() : false,
                    attributes: room.attributes || {},
                    type: 'room'
                };
            }
            return { message: 'Room component not available' };
        } catch (error) {
            return this.handleError('getting room', error);
        }
    }
}

module.exports = RoomCommands;
