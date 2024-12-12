jest.mock('./../../src/logger')
jest.mock('./../../src/config')
jest.mock('./../../src/scenario', () => require('./../__mocks__/scenario'))
const path = require('path')

const Fluent = require('./../../src/fluent')

describe('Fluent setup', () => {
    it('is correctly setup', () => {
        expect(Fluent.components).toEqual({})
        expect(Fluent.scenarios).toEqual({})
        expect(Fluent.inTestMode).toBe(false)
    })

    it('can load custom components', () => {
        const componentPath = path.join(__dirname, '..', 'components', 'popcorn')
        Fluent.loadSetupComponents([{ name: 'popcorn', path: componentPath }])

        const components = Fluent.component.list()
        expect(components).toHaveProperty('popcorn')
        expect(Object.keys(components)).toHaveLength(1)
    })
})

describe('Components management', () => {
    beforeEach(() => {
        Fluent.components = {}
    })

    it('get with an unknown component returns null', () => {
        expect(Fluent.component.findOne('foobar')).toBe(null)
        expect(Fluent.component.get('foobar')).toBe(null)
    })

    it('returns a component that has been set', () => {
        Fluent.components.foobar = new Object()
        expect(Fluent.component.get('foobar')).toBeInstanceOf(Object)
    })

    it('returns all components', () => {
        Fluent.components.foo = new Object()
        Fluent.components.bar = new Object()
        const components = Fluent.component.list()
        expect(components).toHaveProperty('foo')
        expect(components).toHaveProperty('bar')
        expect(Object.keys(components)).toHaveLength(2)
    })

    it('returns an error if the component cannot be found', () => {
        expect(() => Fluent.component.add('/fake/path', 'foobar')).toThrow(Error)
    })

    it('loads in a blank component and can be fetched', () => {
        const componentPath = path.join(__dirname, '..', 'components', 'foobar')
        const result = Fluent.component.add(componentPath, 'foobar')
        expect(result).toBeInstanceOf(Object)

        expect(Fluent.component.get('foobar')).toBeInstanceOf(Object)

        const components = Fluent.component.list()
        expect(components).toHaveProperty('foobar')
        expect(Object.keys(components)).toHaveLength(1)
    })
})

describe('Scenario management', () => {
    beforeEach(() => {
        Fluent.scenarios = {}
    })

    it('returns a newly created scenario', () => {
        const result = Fluent.scenario.add('my foo bar scenario')
        const list = Fluent.scenario.list()
        const count = Fluent.scenario.count()
        expect(Object.keys(list)).toHaveLength(1)
        expect(count).toBe(1)
        expect(result).toBeInstanceOf(Object)
    })

    it('has multiple scenarios', () => {
        Fluent.scenario.add('111')
        Fluent.scenario.add('222')
        Fluent.scenario.add('333')
        Fluent.scenario.add('444')

        const count = Fluent.scenario.list()
        expect(Object.keys(count)).toHaveLength(4)
    })

    it('throws if there is no description', () => {
        expect(() => Fluent.scenario.add()).toThrow(Error)
    })

    it('throws if the scenario description has already been used', () => {
        Fluent.scenario.add('foobar')
        expect(() => Fluent.scenario.add('foobar')).toThrow(Error)
    })
})

describe('Scenario DSL', () => {
    beforeEach(() => {
        Fluent.scenarios = {}
    })

    it('returns a scenario by description', () => {
        const scenario = Fluent.scenario.add('my foo bar scenario')
        const found = Fluent.scenario.get('my foo bar scenario')

        expect(found).toBeInstanceOf(Object)
        expect(scenario).toBe(found)
    })

    it('returns null for a scenario that does not exist', () => {
        const scenario = Fluent.scenario.get('my foo bar scenario')
        expect(scenario).toBe(null)
    })

    it('returns a count of how many scenarios have been created', () => {
        Fluent.scenario.add('my foo bar scenario')
        expect(Fluent.scenario.count()).toBe(1)

        Fluent.scenario.add('my foo bar scenario2')
        expect(Fluent.scenario.count()).toBe(2)
    })

    it('returns a list of scenarios', () => {
        Fluent.scenario.add('my foo bar scenario')
        Fluent.scenario.add('my foo bar scenario2')
        const scenarios = Fluent.scenario.list()
        expect(Object.keys(scenarios)).toHaveLength(2)
    })

    it('returns null if there are no scenarios', () => {
        const scenarios = Fluent.scenario.list()
        expect(scenarios).toBe(null)
    })

    it('returns a scenario by description using key value find', () => {
        Fluent.scenario.add('my foo bar scenario')
        const scenario = Fluent.scenario.findOne({ description: 'my foo bar scenario' })
        expect(scenario).toBeInstanceOf(Object)
    })

    it('returns a scenario by description using just the key', () => {
        Fluent.scenario.add('my foo bar scenario')
        const scenario = Fluent.scenario.findOne('my foo bar scenario')
        expect(scenario).toBeInstanceOf(Object)
    })

    it('return multiple scenarios by find', () => {
        const scenario1 = Fluent.scenario.add('my foo bar scenario1')
        scenario1.foobar = true

        const scenario2 = Fluent.scenario.add('my foo bar scenario2')
        scenario2.foobar = true

        const scenario3 = Fluent.scenario.add('my foo bar scenario3')
        scenario3.foobar = false

        const results = Fluent.scenario.find({ foobar: true })
        expect(Object.keys(results)).toHaveLength(2)
    })

})


describe('Test mode', () => {
    beforeEach(() => {
        Fluent.scenarios = {}
        Fluent.inTestMode = false
    })

    it('scenario two is disabled from running as scenario one was set as test mode', () => {
        const scenario1 = Fluent.scenario.add('scenario one')
        expect(scenario1.testMode).toBe(false)
        expect(scenario1.runnable).toBe(true)

        const scenario2 = Fluent.scenario.add('scenario two')
        expect(scenario2.testMode).toBe(false)
        expect(scenario2.runnable).toBe(true)

        scenario1.testMode = true
        Fluent.updateTestMode(scenario1)

        expect(scenario1.runnable).toBe(true)
        expect(scenario2.runnable).toBe(false)
    })

    it('if in test mode already then scenarios loaded in after are not runnable', () => {
        const scenario1 = Fluent.scenario.add('scenario one')
        expect(scenario1.testMode).toBe(false)
        expect(scenario1.runnable).toBe(true)

        scenario1.testMode = true
        Fluent.updateTestMode(scenario1)

        const scenario2 = Fluent.scenario.add('scenario two')
        expect(scenario2.runnable).toBe(false)

        const scenario3 = Fluent.scenario.add('scenario three')
        expect(scenario3.runnable).toBe(false)
    })
})
