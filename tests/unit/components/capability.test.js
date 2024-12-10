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

    it('can run the capability', () => {
        const callback = jest.fn()
        capability.add('turnOn', callback)
        capability.get('turnOn')()
        expect(callback).toHaveBeenCalledTimes(1)
    })

})


describe('Capability chain methods', () => {

    it('can have a success callback and capability returns a value that can be used in then()', async () => {
        const callbackCapability = jest.fn(() => 'foobar')
        const fn = capability.add('turnOn', callbackCapability)

        const callbackThen = jest.fn()
        await fn().then((resp) => { callbackThen(resp) })

        expect(callbackCapability).toHaveBeenCalledTimes(1)
        expect(callbackThen).toHaveBeenCalledTimes(1)
        expect(callbackThen).toHaveBeenCalledWith('foobar')
    })

    it('can handle async capability', async () => {
        const callbackCapability = async () => new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('foobar')
            }, 100)
        })
        const fn = capability.add('turnOn', callbackCapability)

        const callbackThen = jest.fn()
        await fn().then((resp) => { callbackThen(resp) })

        expect(callbackThen).toHaveBeenCalledTimes(1)
        expect(callbackThen).toHaveBeenCalledWith('foobar')
    })

    it('will call onError if capability throws an error', async () => {
        const callbackCapability = jest.fn(() => { throw new Error('foobar') })
        const fn = capability.add('turnOn', callbackCapability)

        const callbackError = jest.fn()
        await fn().catch((resp) => { callbackError(resp) })

        expect(callbackCapability).toHaveBeenCalledTimes(1)
        expect(callbackError).toHaveBeenCalledTimes(1)
        expect(callbackError).toHaveBeenCalledWith(new Error('foobar'))
    })


    it('will call onError and not call then if capability throws an error', async () => {
        const callbackCapability = jest.fn(() => { throw new Error('foobar') })
        const fn = capability.add('turnOn', callbackCapability)

        const callbackThen = jest.fn()
        const callbackError = jest.fn()
        await fn()
            .then((resp) => { callbackThen(resp) })
            .catch((resp) => { callbackError(resp) })

        expect(callbackCapability).toHaveBeenCalledTimes(1)
        expect(callbackThen).toHaveBeenCalledTimes(0)           // It failed so it should not call
        expect(callbackError).toHaveBeenCalledTimes(1)
        expect(callbackError).toHaveBeenCalledWith(new Error('foobar'))
    })

    it('will call finally for both error and successful capability', async () => {
        const callbackCapability = jest.fn(() => 'foobar')
        const fn = capability.add('turnOn', callbackCapability)

        const callbackThen = jest.fn()
        const callbackError = jest.fn()
        const callbackFinally = jest.fn()
        await fn()
            .then((resp) => { callbackThen(resp) })
            .catch((resp) => { callbackError(resp) })
            .finally(() => { callbackFinally() })

        expect(callbackCapability).toHaveBeenCalledTimes(1)

        expect(callbackThen).toHaveBeenCalledTimes(1)
        expect(callbackThen).toHaveBeenCalledWith('foobar')

        expect(callbackError).toHaveBeenCalledTimes(0)

        expect(callbackFinally).toHaveBeenCalledTimes(1)
    })

    

})