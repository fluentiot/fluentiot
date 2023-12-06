
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const CapabilityComponent = require('./../../../src/components/device/capability_component');
const Fluent = require('./../../../src/fluent');

let capability;
beforeEach(() => {
    capability = new CapabilityComponent(Fluent);
});


describe.only('Capabilities', () => {

    it('can create a new capability', () => {
        const callback = () => {};
        const result = capability.add('turnOn', callback);
        expect(result).toBe(callback);
        expect(Object.keys(capability.capabilities)).toHaveLength(1);
        expect(capability.capabilities.turnOn).toBe(callback);
    });

    it('throws an error if the capability already exists with the same name', () => {
        capability.add('turnOn', () => {});
        expect(() => capability.add('turnOn', () => {})).toThrow();
    });

    it('throws an error when creating a capability without a callback', () => {
        expect(() => capability.add('turnOn')).toThrow();
    });

    it('throws an error if the capability name is empty or uses reserved names', () => {
        expect(() => capability.add('', () => {})).toThrow();
        expect(() => capability.add('turn on', () => {})).toThrow();
        expect(() => capability.add('constructor', () => {})).toThrow();
        expect(() => capability.add('prototype', () => {})).toThrow();
    });

    it('can get an existing capability', () => {
        const callback = () => {};
        capability.add('turnOn', callback);
        expect(capability.get('turnOn')).toBe(callback);
    });

    it('returns null if trying to get a capability that does not exist', () => {
        expect(capability.get('doesNotExist')).toBeNull();
    });

});

