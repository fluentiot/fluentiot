const RoomComponent = require('./../../../src/components/room/room_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/logger');

const DeviceComponent = require('./../../../src/components/device/device_component');
const EventEmitter = require('events');

const mockdate = require('mockdate')
const dayjs = require('dayjs')

let room;

beforeEach(() => {
    jest.useFakeTimers();
    room = new RoomComponent(Fluent)
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

    it('can update attribute and emit, updating twice', () => {
        const office = room.add('officeRoom')
        jest.spyOn(room, 'emit')
        office.attribute.update('foo', 'bar')
        office.attribute.update('foo', 'bar')
        expect(room.emit).toHaveBeenCalledTimes(2)
    })
})


describe('Room vacancyDelay', () => {

    it('can update vacancyDelay with command', () => {
        const office = room.add('officeRoom')
        office.vacancyDelay(20)
        expect(office.attribute.get('vacancyDelay')).toBe(20)

        office.vacancyDelay(15)
        expect(office.attribute.get('vacancyDelay')).toBe(15)

        office.vacancyDelay(0)
        expect(office.attribute.get('vacancyDelay')).toBe(0)
    })

    it('can update vacancyDelay using different formats', () => {
        const office = room.add('officeRoom')

        office.vacancyDelay('1 minute')
        expect(office.attribute.get('vacancyDelay')).toBe(1)

        office.vacancyDelay('5 mins')
        expect(office.attribute.get('vacancyDelay')).toBe(5)

        office.vacancyDelay('1 hour')
        expect(office.attribute.get('vacancyDelay')).toBe(60)
    })

    it('can create a room with different formats', () => {
        const office = room.add('officeRoom1', { vacancyDelay: '1 minute' })
        expect(office.attribute.get('vacancyDelay')).toBe(1)

        const office2 = room.add('officeRoom2', { vacancyDelay: '5 mins' })
        expect(office2.attribute.get('vacancyDelay')).toBe(5)

        const office3 = room.add('officeRoom3', { vacancyDelay: '1 hour' })
        expect(office3.attribute.get('vacancyDelay')).toBe(60)
    })

    it('uses the default vacancyDelay', () => {
        const office = room.add('officeRoom')
        expect(office.attribute.get('vacancyDelay')).toBe(15)
    })

    it('can set vacancyDelay on creation', () => {
        const office = room.add('officeRoom', { vacancyDelay: 20 })
        expect(office.attribute.get('vacancyDelay')).toBe(20)
    })

    it('can set vacancyDelay to 0 on creation', () => {
        const office = room.add('officeRoom', { vacancyDelay: 0 })
        expect(office.attribute.get('vacancyDelay')).toBe(0)
    })

    it('throws if vacancyDelay is not a number on creation', () => {
        expect(() => room.add('officeRoom', { vacancyDelay: 'foobar' })).toThrow()
    })

})


describe('Room occupancy', () => {
    
    afterEach(() => {
        mockdate.reset()
    })

    it('default attributes are setup', () => {
        room.add('officeRoom')
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(false)
        expect(room.get('officeRoom').attribute.get('vacancyDelay')).toBe(15)
        expect(room.get('officeRoom').isOccupied()).toBe(false)
    })

    it('is occupied if attribute is passed', () => {
        room.add('officeRoom', {
            occupied: true,
            vacancyDelay: 20,
            foobar: true,
        })
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(true)
        expect(room.get('officeRoom').attribute.get('foobar')).toBe(true)
        expect(room.get('officeRoom').attribute.get('vacancyDelay')).toBe(20)
    })

    it('can set to occupied and vacant directly', () => {
        room.add('officeRoom')
        expect(room.get('officeRoom').occupied(true))
        expect(room.get('officeRoom').isOccupied()).toBe(true)
        expect(room.get('officeRoom').isVacant()).toBe(false)

        expect(room.get('officeRoom').occupied(false))
        expect(room.get('officeRoom').isOccupied()).toBe(false)
        expect(room.get('officeRoom').isVacant()).toBe(true)
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
        const office = room.add('officeRoom', { vacancyDelay: 0 })
        jest.spyOn(room, 'emit')

        office.updatePresence(true)
        office.updatePresence(false)

        expect(room.get('officeRoom').isOccupied()).toBe(false)
        expect(room.get('officeRoom').isVacant()).toBe(true)
        expect(room.get('officeRoom').attribute.get('occupied')).toBe(false)
        expect(room.emit).toHaveBeenCalledTimes(2)
    })

    it('is still occupied when threshold not met', () => {
        const office = room.add('officeRoom', { vacancyDelay: 2 })
        jest.spyOn(room, 'emit')

        office.updatePresence(true)
        office.updatePresence(false)

        mockdate.set(dayjs().add(1, 'minutes'));
        office._checkIfVacant()

        expect(room.get('officeRoom').isOccupied()).toBe(true)
    })

    it('is vacant after theshold is met', () => {
        const office = room.add('officeRoom', { vacancyDelay: 1 })
        jest.spyOn(room, 'emit')

        office.updatePresence(true)
        office.updatePresence(false)

        mockdate.set(dayjs().add(1, 'minutes'));
        office._checkIfVacant()

        expect(room.get('officeRoom').isOccupied()).toBe(false)
        expect(room.get('officeRoom').isVacant()).toBe(true)
        expect(room.emit).toHaveBeenCalled()
    })

    it('is still occupied when presence updated', () => {
        const office = room.add('officeRoom', { vacancyDelay: 10 })
        jest.spyOn(room, 'emit')

        // NOW: Walks into room
        office.updatePresence(true)
        office._checkIfVacant()
        expect(room.get('officeRoom').isOccupied()).toBe(true)

        // +9 minutes: Walks out of the room -> will be occupied until 19 minutes
        mockdate.set(dayjs().add(9, 'minutes').toDate());
        office.updatePresence(true) //Make sure last sensor time is updated to compare with
        office.updatePresence(false)
        office._checkIfVacant()
        expect(room.get('officeRoom').isOccupied()).toBe(true)

        // +8 minutes: Should remain occupied
        mockdate.set(dayjs().add(9, 'minutes').toDate())
        office._checkIfVacant()
        expect(room.get('officeRoom').isOccupied()).toBe(true)

        // +1 minutes: Now vacant
        mockdate.set(dayjs().add(1, 'minutes').toDate())
        office._checkIfVacant()
        expect(room.get('officeRoom').isOccupied()).toBe(false)
        
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
        kitchen = room.add('kitchen', { vacancyDelay: 0 });
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
        const living = room.add('living', { vacancyDelay: 0 })

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

    it('passes if the room is occupied by using presense and threshold duration is set to 0', () => {
        const living = room.add('living', { vacancyDelay: 0 })
        living.updatePresence(true)
        expect(room.constraints().room('living').isOccupied()()).toBe(true)

        living.updatePresence(false)
        expect(room.constraints().room('living').isOccupied()()).toBe(false)
    })

    it('attributes work in constraints', () => {
        office.attribute.set('occupied', true);
        expect(room.constraints().room('office').attribute('occupied').is(true)()).toBe(true)
        expect(room.constraints().room('office').attribute('occupied').is('foobar')()).toBe(false)
    })

})



describe('Room attribute expects', () => {

    let Scenario
    let office
    let device

    beforeEach(() => {
        device = new DeviceComponent(Fluent);
        Scenario = ComponentHelper.ScenarioAndEvent(room)
        office = room.add('office')
    })

    it('can use is expects', () => {
        office.attribute.set('occupied', true)
        expect(office.attribute.expect('occupied').is(true)).toBe(true)
        expect(office.attribute.expect('occupied').is(false)).toBe(false)

        expect(office.attribute.expect('occupied').isTruthy()).toBe(true)
    })


});

describe('Room find using find DSL', () => {

    it('can find rooms by a single attribute', () => {
        const room1 = room.add('office', { id: '123' })
        const foundRoom = room.find('attributes', { 'id': '123' })
        expect(foundRoom).toStrictEqual([room1])
    })

    it('can find rooms by a single attribute', () => {
        const room1 = room.add('office', { id: '123' })
        const room2 = room.add('living', { id: '321' })

        const foundRoom1 = room.find('attributes', { 'id': '123' })
        const foundRoom2 = room.find('attributes', { 'id': '321' })

        expect(foundRoom1).toStrictEqual([room1])
        expect(foundRoom2).toStrictEqual([room2])
    })

    it('can find rooms by a multiple attributes', () => {
        const room1 = room.add('office', { id: '123', group: 'office' })
        const foundRoom1 = room.find('attributes', { id: '123', group: 'office' })

        expect(foundRoom1).toStrictEqual([room1])
    })

    it('can find rooms by name', () => {
        const room1 = room.add('office')
        const foundRoom1 = room.find({ name: 'office' })

        expect(foundRoom1).toStrictEqual([room1])
    })

})