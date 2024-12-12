jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/logger')

const DeviceComponent = require('./../../../src/components/device/device_component')
const Fluent = require('./../../../src/fluent')
const ComponentHelper = require('./../../helpers/component_helper.js')

let device
beforeEach(() => {
    device = new DeviceComponent(Fluent)
})

describe('Device add', () => {
    it('creates a device and can be fetched', () => {
        const newDevice = device.add('pir')
        expect(newDevice).toBeInstanceOf(Object)
        expect(device.get('pir')).toBe(newDevice)
    })

    it('returns null if a device cannot be found', () => {
        expect(device.get('pir')).toBe(null)
    })

    it('fails if another device is added with the same name', () => {
        device.add('pir')
        expect(() => device.add('pir')).toThrow(Error)
    })

    it('throws if scene name is not valid', () => {
        expect(() => device.add('my name')).toThrow()
    })
})

describe('Device attributes', () => {
    it('creates a device with passed attributes', () => {
        const newDevice = device.add('pir', { foo: 'bar' })
        expect(newDevice.attribute.get('foo')).toBe('bar')
    })

    it('handles being passed as null/empty/false', () => {
        const newDevice1 = device.add('pir1')
        expect(newDevice1.attribute.get('foo')).toBe(null)

        const newDevice2 = device.add('pir2', null)
        expect(newDevice2.attribute.get('foo')).toBe(null)

        const newDevice3 = device.add('pir3', false)
        expect(newDevice3.attribute.get('foo')).toBe(null)
    })

    it('stateful as default', () => {
        const newDevice1 = device.add('pir')
        expect(newDevice1.attribute.get('stateful')).toBe(true)

        const newDevice2 = device.add('pir2', { stateful:false })
        expect(newDevice2.attribute.get('stateful')).toBe(false)
    })

    it('set attributes with various values', () => {
        const newDevice1 = device.add('pir')
        newDevice1.attribute.set('stateful', false)

        newDevice1.attribute.set('test1', true)
        newDevice1.attribute.set('test2', false)
        newDevice1.attribute.set('test3', 123)
        newDevice1.attribute.set('test4', 10.12)
        newDevice1.attribute.set('test5', "foobar")

        expect(newDevice1.attribute.get('stateful')).toBe(false)
        expect(newDevice1.attribute.get('test1')).toBe(true)
        expect(newDevice1.attribute.get('test2')).toBe(false)
        expect(newDevice1.attribute.get('test3')).toBe(123)
        expect(newDevice1.attribute.get('test4')).toBe(10.12)
        expect(newDevice1.attribute.get('test5')).toBe("foobar")
    })

})

describe('Device capabilities', () => {
    let officeSwitch

    beforeEach(() => {
        device = new DeviceComponent(Fluent)
        officeSwitch = device.add('officeSwitch')

        const fakeCapabilityComponent = {
            get: (name) => {
                if (name === 'switchOff') {
                    return () => {
                        return true
                    }
                }
                return false
            },
        }

        device.getComponent = jest.fn(() => {
            return fakeCapabilityComponent
        })
    })

    it('can add a capability as an object', () => {
        const callback = () => {
            return true
        }
        const result = officeSwitch.capability.add('switchOn', callback)

        expect(result).toBe(true)
        expect(Object.keys(officeSwitch.capabilities)).toHaveLength(1)

        expect(officeSwitch.capabilities.switchOn).toBeDefined()
        expect(officeSwitch.capabilities.switchOn).toBe(callback)
    })

    it('throws an error if the capability has a space in the name', () => {
        expect(() =>
            officeSwitch.capability.add('switch on', () => {
                return true
            })
        ).toThrow(Error)
    })

    it('throws an error if the capability with the same name has been added already', () => {
        officeSwitch.capability.add('switchOn', () => {
            return true
        })
        expect(() =>
            officeSwitch.capability.add('switchOn', () => {
                return true
            })
        ).toThrow(Error)
    })

    it('throws an error if passing an object that is not a capability object', () => {
        const foobar = new Object()
        expect(() => officeSwitch.capability.add(foobar)).toThrow(Error)
    })

    it('can add a capability if passed as an object with known interface', () => {
        const foobar = new Object()
        foobar.name = 'switchOn'
        foobar.callback = () => {
            return true
        }

        const result = officeSwitch.capability.add(foobar)
        expect(result).toBe(true)
        expect(officeSwitch.capabilities['switchOn']).toBeDefined()
    })

    it('can add a capability and then run it', () => {
        const callback = () => {
            return true
        }
        officeSwitch.capability.add('switchOn', callback)
        const result = officeSwitch.switchOn()
        expect(result).toBe(true)
    })

    it('can add a capability and parameters are passed to it', () => {
        const callback = (_parent, arg1, arg2) => {
            if (arg1 === 'foo' && arg2 === 'bar') {
                return true
            }
            return false
        }

        officeSwitch.capability.add('switchOn', callback)

        expect(officeSwitch.switchOn('foo', 'bar')).toBe(true)
        expect(officeSwitch.switchOn('foo')).toBe(false)
        expect(officeSwitch.switchOn()).toBe(false)
    })

    it('can add an existing capability using the @ symbol', () => {
        officeSwitch.capability.add('@switchOff')
        const result = officeSwitch.switchOff()
        expect(result).toBe(true)
    })

    it('throws an error if defining a callback when using a reference', () => {
        expect(() => officeSwitch.capability.add('@switchOff', () => {})).toThrow(Error)
    })

    it('throws an error if referenced @ capability has already been added', () => {
        officeSwitch.capability.add('@switchOff')
        expect(() => officeSwitch.capability.add('@switchOff')).toThrow(Error)
    })

    it('throws an error if referenced @ does not exist', () => {
        expect(() => officeSwitch.capability.add('@doesNotExist')).toThrow(Error)
    })

    it('can create a new device with capabilities', () => {
        const livingLight = device.add('livingRoomLight', {}, ['@switchOff'])
        expect(livingLight.switchOff()).toBe(true)
    })

    it('will throw an error when setting up a device with a capability that does not exist', () => {
        expect(() => device.add('livingRoomLight', {}, ['@doesNotExist'])).toThrow(Error)
    })

    it('will throw an error if passed capability is not a reference', () => {
        expect(() => device.add('livingRoomLight', {}, ['notReference'])).toThrow(Error)
    })

    it('capability can be executed and returns a success or failure', () => {
        officeSwitch.capability.add('switchOn', () => {
            return true
        })
        officeSwitch.capability.add('switchOff', () => {
            return false
        })

        expect(officeSwitch.switchOn()).toBe(true)
        expect(officeSwitch.switchOff()).toBe(false)
    })
    
})

describe('Device triggers', () => {
    let Scenario
    let device
    let playroomPir
    let lightSensor

    beforeEach(() => {
        device = new DeviceComponent(Fluent)
        Scenario = ComponentHelper.ScenarioAndEvent(device)
        playroomPir = device.add('pir')
        lightSensor = device.add('lightSensor')
    })

    it('triggers if a number goes above', () => {
        device.triggers(Scenario).device('lightSensor').attribute('value').isGreaterThan(10)
        lightSensor.attribute.update('value', 11)
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

    it('triggers if a number goes below', () => {
        device.triggers(Scenario).device('lightSensor').attribute('value').isLessThan(10)
        lightSensor.attribute.update('value', 9)
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

    it('triggers based on number values', () => {
        device.triggers(Scenario).device('lightSensor').attribute('value').isGreaterThan(10)
        lightSensor.attribute.update('value', 11)

        device.triggers(Scenario).device('lightSensor').attribute('value2').isGreaterThanOrEqual(10)
        lightSensor.attribute.update('value2', 10)

        device.triggers(Scenario).device('lightSensor').attribute('value3').isLessThan(10)
        lightSensor.attribute.update('value3', 9)

        device.triggers(Scenario).device('lightSensor').attribute('value4').isLessThanOrEqual(10)
        lightSensor.attribute.update('value4', 10)

        expect(Scenario.assert).toHaveBeenCalledTimes(4)
    })

    it('throws error if device is not found', () => {
        expect(() => device.triggers(Scenario).device('unknownDevice').attribute('foo').is(true)).toThrow()
    })

    it('it triggers when an attribute is updated to true', () => {
        device.triggers(Scenario).device('pir').attribute('foo').is(true)
        playroomPir.attribute.update('foo', true)
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('it triggers when an attribute is updated to false', () => {
        device.triggers(Scenario).device('pir').attribute('foo').is(false)
        playroomPir.attribute.update('foo', false)
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('it does not trigger if another device attribute is updated', () => {
        device.triggers(Scenario).device('pir').attribute('foo').is(true)
        playroomPir.attribute.update('bar', true)
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('it does not trigger if another device was updated', () => {
        const livingPir = device.add('livingPir')
        device.triggers(Scenario).device('pir').attribute('foo').is(true)
        livingPir.attribute.update('foo', true)
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('it triggers multiple times for attribute checking', () => {
        device.triggers(Scenario).device('pir').is('occupied')
        device.triggers(Scenario).device('pir').is('occupied')
        playroomPir.attribute.update('occupied', true)

        device.triggers(Scenario).device('pir').isNot('occupied')
        device.triggers(Scenario).device('pir').isNot('occupied')
        playroomPir.attribute.update('occupied', false)

        expect(Scenario.assert).toHaveBeenCalledTimes(4)
    })

    it('it triggers when string matches', () => {
        device.triggers(Scenario).device('pir').attribute('colour').is('red')
        playroomPir.attribute.update('colour', 'red')
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('it triggers when string does not match', () => {
        device.triggers(Scenario).device('pir').attribute('colour').isNot('red')
        playroomPir.attribute.update('colour', 'red')
        playroomPir.attribute.update('colour', 'blue')
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

    it('it triggers when any change is made to the attribute', () => {
        device.triggers(Scenario).device('pir').attribute('colour').changes()
        playroomPir.attribute.update('colour', 'red')
        playroomPir.attribute.update('colour', 'blue')
        playroomPir.attribute.update('colour', 'green')
        playroomPir.attribute.update('colour', true)
        playroomPir.attribute.update('colour', false)
        expect(Scenario.assert).toHaveBeenCalledTimes(5)
    })
})



describe('Device triggers with state', () => {
    let Scenario
    let device

    beforeEach(() => {
        device = new DeviceComponent(Fluent)
        Scenario = ComponentHelper.ScenarioAndEvent(device)
    })

    it('it only triggers once because it is a stateful switch', () => {
        const playroomSwitch = device.add('playroomSwitch', { stateful: true })
        device.triggers(Scenario).device('playroomSwitch').attribute('switch').is('on')
        playroomSwitch.attribute.update('switch', 'on')
        playroomSwitch.attribute.update('switch', 'on')      
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

    it('it only triggers once because it is a stateful switch by default', () => {
        //Create switch with stateful not defined, make sure default it is stateful
        const playroomSwitch = device.add('playroomSwitch')
        device.triggers(Scenario).device('playroomSwitch').attribute('switch').is('on')
        playroomSwitch.attribute.update('switch', 'on')
        playroomSwitch.attribute.update('switch', 'on')      
        expect(Scenario.assert).toHaveBeenCalledTimes(1)
    })

    it('it can trigger multiple times because it is a none stateful button', () => {
        const playroomButton = device.add('playroomButton', { stateful: false })
        device.triggers(Scenario).device('playroomButton').attribute('switch').is('on')
        playroomButton.attribute.update('switch', 'on')
        playroomButton.attribute.update('switch', 'on')      
        expect(Scenario.assert).toHaveBeenCalledTimes(2)
    })

});




describe('Device constraints', () => {
    let Scenario
    let device
    let playroomPir

    beforeEach(() => {
        device = new DeviceComponent(Fluent)
        Scenario = ComponentHelper.ScenarioAndEvent(device)
        
        playroomPir = device.add('pir')
    })

    it('passes if the device is online', () => {
        playroomPir.attribute.set('online', true);
        expect(device.constraints().device('pir').attribute('online').is(true)()).toBe(true)
        expect(device.constraints().device('pir').attribute('online').is('foobar')()).toBe(false)
    })

})


describe('Device find using find DSL', () => {

    it('can find devices by a single attribute', () => {
        const device1 = device.add('pirOffice', { id: '123' })
        const foundDevice1 = device.find('attributes', { 'id': '123' })
        expect(foundDevice1).toStrictEqual([device1])
    })

    it('can find devices by a single attribute', () => {
        const device1 = device.add('pirOffice', { id: '123' })
        const device2 = device.add('pirLiving', { id: '321' })

        const foundDevice1 = device.find('attributes', { 'id': '123' })
        const foundDevice2 = device.find('attributes', { 'id': '321' })

        expect(foundDevice1).toStrictEqual([device1])
        expect(foundDevice2).toStrictEqual([device2])
    })

    it('can find devices by a multiple attributes', () => {
        const device1 = device.add('pirOffice', { id: '123', group: 'office' })
        const foundDevice1 = device.find('attributes', { id: '123', group: 'office' })

        expect(foundDevice1).toStrictEqual([device1])
    })

    it('can find devices by name', () => {
        const device1 = device.add('pirOffice')
        const foundDevice1 = device.find({ name: 'pirOffice' })
        expect(foundDevice1).toStrictEqual([device1])
    })

    it('can find devices by id and get the name', () => {
        device.add('pirOffice', { id:'ebc2851e7a72d7f29eehww' })
        const foundDevice = device.findOne('attributes', { id: 'ebc2851e7a72d7f29eehww' })
        expect(foundDevice.name).toBe('pirOffice')
    })

    it('can count the devices', () => {
        expect(device.count()).toBe(0)

        device.add('dev1')
        device.add('dev2')
        device.add('dev3')
        expect(device.count()).toBe(3)

        device.add('dev4')
        expect(device.count()).toBe(4)
    })

    it('can list all devices', () => {
        expect(device.list()).toBe(null)

        const dev1 = device.add('dev1')
        expect(device.list()).toStrictEqual({ dev1 })

        const dev2 = device.add('dev2')
        expect(device.list()).toStrictEqual({ dev1, dev2 })
    })

})
