
const RoomComponent = require('./../../../src/components/room/room_component');
const Fluent = require('./../../../src/fluent');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

let room;

beforeEach(() => {
    room = new RoomComponent(Fluent);
    //jest.spyOn(variable, 'emit')
});

describe('Room add and get', () => {

    it.only('returns the newly created room after adding it', () => {
        const newRoom = room.add('office room');
        expect(newRoom).toBeInstanceOf(Object);
        expect(room.get('office room')).toBe(newRoom);
        expect(Object.keys(room.rooms)).toHaveLength(1);
    });

    it.only('returns false if trying to add a room with a name that already exists', () => {
        room.add('office room');
        expect(room.add('office room')).toBe(false);
    });

    it.only('returns false if the room cannot be found by the name', () => {
        expect(room.get('living room')).toBe(false);
    });

    it('', () => {
        expect(1).toBe(1);
    });

    it('', () => {
        expect(1).toBe(1);
    });

});

