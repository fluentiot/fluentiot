const RoomComponent = require('./../../../src/components/room/room_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const DeviceComponent = require('./../../../src/components/device/device_component');
const EventEmitter = require('events');

let room;

beforeEach(() => {
    room = new RoomComponent(Fluent)
    //jest.spyOn(variable, 'emit')
})

describe('Room add and get', () => {
    it('returns the newly created room after adding it', () => {
        const newRoom = room.add('officeRoom')
        expect(newRoom).toBeInstanceOf(Object)
        expect(room.get('officeRoom')).toBe(newRoom)
        expect(Object.keys(room.rooms)).toHaveLength(1)
    })

    it('throws if trying to add a room with a name that already exists', () => {
        room.add('officeRoom')
        expect(() => room.add('officeRoom')).toThrow()
    })

    it('throws if room name is not valid', () => {
        expect(() => room.add('office room')).toThrow()
    })

    it('returns null if the room cannot be found by the name', () => {
        expect(room.get('living room')).toBe(null)
    })
})

describe('Room attributes DSL', () => {
    it('can set attribute and does not emit', () => {
        const office = room.add('officeRoom')
        jest.spyOn(room, 'emit')
        expect(office.attribute.set('foobar', true)).toBe(true)
        expect(room.emit).not.toHaveBeenCalled()
    })

    it('can get attribute by name', () => {
        const office = room.add('officeRoom')
        office.attribute.set('foo', 'bar')
        expect(office.attribute.get('foo')).toBe('bar')
    })

    it('get attribute returns null if not found', () => {
        const office = room.add('officeRoom')
        expect(office.attribute.get('foo')).toBe(null)
    })

    it('can update attribute and emit, updating twice does not emit twice', () => {
        const office = room.add('officeRoom')
        jest.spyOn(room, 'emit')
        office.attribute.update('foo', 'bar')
        office.attribute.update('foo', 'bar')
        expect(room.emit).toHaveBeenCalledTimes(1)
    })
})

describe('Room occupancy', () => {
    it('default attributes are setup', () => {
        room.add('officeRoom')
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(false)
        expect(room.get('officeRoom').attribute.get('thresholdDuration')).toBe(15)
        expect(room.get('officeRoom').isOccupied()).toBe(false)
    })

    it('is occupied if attribute is passed', () => {
        room.add('officeRoom', {
            occupied: true,
            thresholdDuration: 20,
            foobar: true,
        })
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(true)
        expect(room.get('officeRoom').attribute.get('foobar')).toBe(true)
        expect(room.get('officeRoom').attribute.get('thresholdDuration')).toBe(20)
    })

    it('handles get and set attributes', () => {
        room.add('officeRoom')
        room.get('officeRoom').attribute.set('foobar', '1')
        room.get('officeRoom').attribute.set('foobar', '2')
        expect(room.get('officeRoom').attribute.get('foobar')).toBe('2')
    })

    it('returns null if the attribute is not set already', () => {
        room.add('officeRoom')
        expect(room.get('officeRoom').attribute.get('foobar')).toBe(null)
    })

    it('makes the room occupied based on a positive sensor value', () => {
        const office = room.add('officeRoom')
        office.updatePresence(true)

        expect(room.get('officeRoom').isOccupied()).toBe(true)
        expect(room.get('officeRoom').isVacant()).toBe(false)
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(true)
    })

    it('stays occupied even if the sensor is negative', () => {
        const office = room.add('officeRoom')
        office.updatePresence(true)
        office.updatePresence(false)
        office._checkIfVacant()

        expect(room.get('officeRoom').isOccupied()).toBe(true)
        expect(room.get('officeRoom').isVacant()).toBe(false)
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(true)
    })

    it('sets the room to vacant if threshold duration is 0 and receved a negative sensor value', () => {
        const office = room.add('officeRoom', { thresholdDuration: 0 })
        jest.spyOn(room, 'emit')

        office.updatePresence(true)
        office.updatePresence(false)

        expect(room.get('officeRoom').isOccupied()).toBe(false)
        expect(room.get('officeRoom').isVacant()).toBe(true)
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(false)
        expect(room.emit).toHaveBeenCalledTimes(2)
    })
})


describe('Room occupancy set with sensors', () => {
    let device;
    let office;
    let officePir1;
    let officePir2;
    let kitchenPir1;
    let kitchenPir2;
    let kitchen;

    beforeEach(() => {
        class MyEmitter extends EventEmitter {}
        room._event = new MyEmitter();

        device = new DeviceComponent(Fluent);

        officePir1 = device.add('officePir1');
        officePir2 = device.add('officePir2');
        office = room.add('office');
        office.addPresenceSensor(officePir1, 'pir', true);
        office.addPresenceSensor(officePir2, 'pirSensor', 'pir');

        kitchenPir1 = device.add('kitchenPir1');
        kitchenPir2 = device.add('kitchenPir2');
        kitchen = room.add('kitchen', { thresholdDuration: 0 });
        kitchen.addPresenceSensor(kitchenPir1, 'pir', true);
        kitchen.addPresenceSensor(kitchenPir2, 'pirSensor', 'pir');
    });

    it('pir sensor sets room to occupied', () => {
        room.event().emit('device.officePir1.attribute',{ name:'pir', value:true });
        expect(room.get('office').isOccupied()).toBe(true);
    });

    it('pir with wrong value does not set room to occupied', () => {
        room.event().emit('device.officePir1.attribute',{ name:'pir', value:false });
        room.event().emit('device.officePir1.attribute',{ name:'pir', value:'abc' });
        room.event().emit('device.officePir1.attribute',{ name:'pir', value:1 });

        expect(room.get('office').isOccupied()).toBe(false);
    });

    it('sets room to occupied on second sensor', () => {
        room.event().emit('device.officePir2.attribute',{ name:'pirSensor', value:'pir' });
        expect(room.get('office').isOccupied()).toBe(true);
    });

    it('sets room to occupied if both sensors are true', () => {
        room.event().emit('device.officePir1.attribute',{ name:'pir', value:true });
        room.event().emit('device.officePir2.attribute',{ name:'pirSensor', value:'pir' });
        expect(room.get('office').isOccupied()).toBe(true);
    });

    it('pir sensor sets room to vacant', () => {
        room.event().emit('device.kitchenPir1.attribute',{ name:'pir', value:true });
        expect(room.get('kitchen').isOccupied()).toBe(true);

        room.event().emit('device.kitchenPir1.attribute',{ name:'pir', value:false });
        expect(room.get('kitchen').isOccupied()).toBe(false);
    });

});


describe('Room triggers', () => {
    let Scenario
    let office

    beforeEach(() => {
        Scenario = ComponentHelper.ScenarioAndEvent(room)
        office = room.add('office')
        jest.spyOn(room, 'emit')
    })

    it('triggers when a room is occupied', () => {
        room.triggers(Scenario).room('office').isOccupied()
        office.updatePresence(true)
        expect(room.emit).toHaveBeenCalledTimes(1)
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('throws an error if the room does not exist', () => {
        expect(() => room.triggers(Scenario).room('foobar').isOccupied()).toThrow(Error)
    })

    it('triggers when a room is vacant', () => {
        const living = room.add('living', { thresholdDuration: 0 })

        room.triggers(Scenario).room('living').isVacant()

        living.updatePresence(true)
        living.updatePresence(false)

        expect(room.emit).toHaveBeenCalledTimes(2)
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

})



describe('Room constraints', () => {
    let Scenario
    let office
    let device

    beforeEach(() => {
        device = new DeviceComponent(Fluent);
        Scenario = ComponentHelper.ScenarioAndEvent(room)
        office = room.add('office')
    })

    it('passes if the room is occupied', () => {
        office.attribute.set('occupied', true);
        expect(room.constraints().room('office').isOccupied()()).toBe(true)

        office.attribute.set('occupied', false);
        expect(room.constraints().room('office').isOccupied()()).toBe(false)
    })

    it('passes if the room is vacant', () => {
        office.attribute.set('occupied', false);
        expect(room.constraints().room('office').isVacant()()).toBe(true)

        office.attribute.set('occupied', true);
        expect(room.constraints().room('office').isVacant()()).toBe(false)
    })

    it('passes if the room is occupied by using presense', () => {
        const living = room.add('living', { thresholdDuration: 0 })
        living.updatePresence(true)
        expect(room.constraints().room('living').isOccupied()()).toBe(true)

        living.updatePresence(false)
        expect(room.constraints().room('living').isOccupied()()).toBe(false)
    })

})
