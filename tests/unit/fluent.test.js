
jest.mock('./../../src/utils/logger');
jest.mock('./../../src/config');
jest.mock('./../../src/scenario', () => require('./../__mocks__/scenario'));
const path = require('path');

const Fluent = require('./../../src/fluent');

beforeEach(() => {
});

describe('Fluent setup', () => {

    it('is correctly setup', () => {
        expect(Fluent.components).toEqual({});
        expect(Fluent.scenarios).toEqual([]);
        expect(Fluent.inTestMode).toBe(false);
    });

    it('can load custom components', () => {
        const componentPath = path.join(__dirname, '..', 'components', 'popcorn')
        Fluent.loadSetupComponents([
            { name:"popcorn", path:componentPath }
        ]);
        const components = Fluent.component().all();
        expect(components).toHaveProperty('popcorn');
        expect(Object.keys(components)).toHaveLength(1);
    });
    
});


describe('Components management', () => {
    beforeEach(() => {
        Fluent.components = {};
    });

    it('get with an unknown component fails', () => {
        expect(() => Fluent.component().get('foobar')).toThrow(Error);
    });

    it('returns a component that has been set', () => {
        Fluent.components.foobar = new Object();
        expect(Fluent.component().get('foobar')).toBeInstanceOf(Object);
    });

    it('returns all components', () => {
        Fluent.components.foo = new Object();
        Fluent.components.bar = new Object();
        const components = Fluent.component().all();
        expect(components).toHaveProperty('foo');
        expect(components).toHaveProperty('bar');
        expect(Object.keys(components)).toHaveLength(2);
    });

    it('returns an error if the component cannot be found', () => {
        expect(() => Fluent.component().add('/fake/path', 'foobar')).toThrow(Error);
    });

    it('loads in a blank component and can be fetched', () => {
        const componentPath = path.join(__dirname, '..', 'components', 'foobar')
        const result = Fluent.component().add(componentPath, 'foobar');
        expect(result).toBeInstanceOf(Object);

        expect(Fluent.component().get('foobar')).toBeInstanceOf(Object);

        const components = Fluent.component().all();
        expect(components).toHaveProperty('foobar');
        expect(Object.keys(components)).toHaveLength(1);
    });

    it('loading a component missing an init method', () => {
        const componentPath = path.join(__dirname, '..', 'components', 'foobar')
        
        expect(() => Fluent.component().add(componentPath, 'missing-init')).toThrow(Error);
    });
    
});


describe('Scenario management', () => {
    beforeEach(() => {
        Fluent.scenarios = [];
    });

    it('returns a newly created scenario', () => {
        const result = Fluent.scenario().create('my foo bar scenario');
        const count = Fluent.scenario().all();
        expect(count).toHaveLength(1)
        expect(result).toBeInstanceOf(Object);
    });

    it('has multiple scenarios', () => {
        Fluent.scenario().create('111');
        Fluent.scenario().create('222');
        Fluent.scenario().create('333');
        Fluent.scenario().create('444');

        const count = Fluent.scenario().all();
        expect(count).toHaveLength(4)
    });

    it('throws if there is no description', () => {
        expect(() => Fluent.scenario().create()).toThrow(Error);
    });

    it('throws if the scenario description has already been used', () => {
        Fluent.scenario().create('foobar');
        expect(() => Fluent.scenario().create('foobar')).toThrow(Error);
    });

});


describe('Test mode', () => {
    beforeEach(() => {
        Fluent.scenarios = [];
        Fluent.inTestMode = false;
    });

    it('scenario two is disabled from running as scenario one was set as test mode', () => {
        const scenario1 = Fluent.scenario().create('scenario one');
        expect(scenario1.testMode).toBe(false);
        expect(scenario1.runnable).toBe(true);

        const scenario2 = Fluent.scenario().create('scenario two');
        expect(scenario2.testMode).toBe(false);
        expect(scenario2.runnable).toBe(true);

        scenario1.testMode = true;
        Fluent.updateTestMode(scenario1);

        expect(scenario1.runnable).toBe(true);
        expect(scenario2.runnable).toBe(false);
    });

    it('if in test mode already then scenarios loaded in after are not runnable', () => {
        const scenario1 = Fluent.scenario().create('scenario one');
        expect(scenario1.testMode).toBe(false);
        expect(scenario1.runnable).toBe(true);

        scenario1.testMode = true;
        Fluent.updateTestMode(scenario1);

        const scenario2 = Fluent.scenario().create('scenario two');
        expect(scenario2.runnable).toBe(false);

        const scenario3 = Fluent.scenario().create('scenario three');
        expect(scenario3.runnable).toBe(false);
    });

    
});