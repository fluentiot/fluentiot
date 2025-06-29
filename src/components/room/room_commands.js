const Command = require('../command');

/**
 * Room-related commands for managing and inspecting room states and occupancy
 */
class RoomCommands extends Command {
    
    getComponentName() {
        return 'room';
    }

    getCommands() {
        return {
            'room.list': {
                handler: this.listRooms.bind(this),
                description: 'List all rooms in the system with their occupancy status and associated devices',
                parameters: []
            },
            'room.get': {
                handler: this.getRoom.bind(this),
                description: 'Get detailed information about a specific room including occupancy and attributes',
                parameters: [
                    { name: 'roomId', type: 'string', required: true, description: 'The ID or name of the room' },
                    { name: 'action', type: 'string', required: false, description: 'Optional action like "describe" for detailed info' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'inspect room [name]',
            'list all rooms',
            'check room occupancy [name]'
        ];
    }

    listRooms(params) {
        try {
            const roomComponent = this.getComponent('room');
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
            const roomComponent = this.getComponent('room');
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
