jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/commons/logger')

const CapabilityComponent = require('./../../../src/components/device/capability_component')
const Fluent = require('./../../../src/fluent')

let capability
beforeEach(() => {
    capability = new CapabilityComponent(Fluent)
})

describe('Capabilities', () => {
    it('can create a new capability', () => {
        const callback = () => {}
        capability.add('turnOn', callback)
        expect(Object.keys(capability.capabilities)).toHaveLength(1)
        expect(capability.capabilities.turnOn).toBeDefined()
    })

    it('capability can run by getting it', () => {
        const callback = jest.fn()
        capability.add('turnOn', callback)
        const fn = capability.get('turnOn')
        fn()
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('capability can run being returned', () => {
        const callback = jest.fn()
        const fn = capability.add('turnOn', callback)
        fn()
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('capability can run being returned with a fake device', () => {
        const callback = jest.fn()
        const fn = capability.add('turnOn', callback)
        const fakeDevice = { name: 'fakeDevice' }
        fn(fakeDevice)
        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith(fakeDevice)
    })

    it('capability run and multiple args are passed', () => {
        const callback = jest.fn()
        const fn = capability.add('turnOn', callback)
        const fakeDevice = { name: 'fakeDevice' }
        fn(fakeDevice, '1', '2', 3, true)
        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith(fakeDevice, '1', '2', 3, true)
    })

    it('throws an error if the capability already exists with the same name', () => {
        capability.add('turnOn', () => {})
        expect(() => capability.add('turnOn', () => {})).toThrow()
    })

    it('throws an error when creating a capability without a callback', () => {
        expect(() => capability.add('turnOn')).toThrow()
    })

    it('throws an error if the capability name is empty or uses reserved names', () => {
        expect(() => capability.add('', () => {})).toThrow()
        expect(() => capability.add('turn on', () => {})).toThrow()
        expect(() => capability.add('constructor', () => {})).toThrow()
        expect(() => capability.add('prototype', () => {})).toThrow()
    })

    it('can get an existing capability', () => {
        const callback = () => {}
        const result = capability.add('turnOn', callback)
        expect(capability.get('turnOn')).toBe(result)
    })

    it('returns null if trying to get a capability that does not exist', () => {
        expect(capability.get('doesNotExist')).toBeNull()
    })
})
