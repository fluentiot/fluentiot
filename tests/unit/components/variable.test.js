const VariableComponent = require('./../../../src/components/variable/variable_component')
const Fluent = require('./../../../src/fluent')
const ComponentHelper = require('./../../helpers/component_helper.js')
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/logger')

let variable

beforeEach(() => {
    variable = new VariableComponent(Fluent)
    jest.spyOn(variable, 'emit')
})

describe('Variable set, remove and get', () => {
    it('sets a variable and emits', () => {
        variable.set('foo', 'bar')
        variable.set('pop', 'corn')
        variable.set('pop', 'korn')

        expect(variable.get('foo')).toBe('bar')
        expect(variable.get('pop')).toBe('korn')
        expect(Object.keys(variable.variables)).toHaveLength(2)
        expect(variable.emit).toHaveBeenCalledTimes(3)
    })

    it('returns null if variable does not exist', () => {
        expect(variable.get('foo')).toBe(null)
    })

    it('returns false if the variable does not exist and is being removed', () => {
        expect(variable.remove('foo')).toBe(false)
    })

    it('can be set, get, removed and returns null', () => {
        variable.set('foo', 'bar')
        expect(variable.remove('foo')).toBe(true)
        expect(variable.get('foo')).toBe(null)
    })

    it('throws if variable name is not valid', () => {
        expect(() => variable.set('my name', 'foo')).toThrow()
    })
})

describe('Variable expiry', () => {
    it('can set a variable with expiry', () => {
        const result = variable.set('foo', 'bar', { expiry: '1 min' })
        expect(variable.variables.foo.options.expiry).toBeInstanceOf(Object)
        expect(result).toBe(true)
    })

    it('returns false if the expiry could not be parsed', () => {
        expect(variable.set('foo', 'bar', { expiry: 'xxx' })).toBe(false)
    })

    it('returns true for common expiry dates', () => {
        expect(variable.set('foo', 'bar', { expiry: '1 second' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 sec' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 s' })).toBe(true)

        expect(variable.set('foo', 'bar', { expiry: '1 minute' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 min' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 m' })).toBe(true)

        expect(variable.set('foo', 'bar', { expiry: '1 hour' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 hr' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 h' })).toBe(true)

        expect(variable.set('foo', 'bar', { expiry: '1 day' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 month' })).toBe(true)
        expect(variable.set('foo', 'bar', { expiry: '1 year' })).toBe(true)
    })

    it('returns null if its expired', () => {
        variable.set('foo', 'bar', { expiry: '-1 minute' })
        expect(variable.get('foo')).toBe(null)
        expect(variable.emit).toHaveBeenCalledTimes(2) //Set and then removed
    })

    it('not null because it has not expired', () => {
        variable.set('foo', 'bar', { expiry: '1 minute' })
        expect(variable.get('foo')).toBe('bar')
        expect(variable.emit).toHaveBeenCalledTimes(1) //Set
    })
})

describe('Variable constraints with expect abstraction', () => {
    it('will load the variable in once constraint is called', () => {
        variable.set('foo', 'foo')
        const constraint = variable.constraints().variable('foo').is('foo')

        variable.set('foo', 'bar')

        expect(typeof constraint).toBe('function')
        expect(constraint()).toBe(false)
    })

    it('can be called multiple times with different values over time', () => {
        const constraint = variable.constraints().variable('foo').is('foo')

        variable.set('foo', 'bar')
        const result1 = constraint()

        variable.set('foo', 'foo')
        const result2 = constraint()

        expect(result1).toBe(false)
        expect(result2).toBe(true)
    })

    it('supports being defined', () => {
        const constraint = variable.constraints().variable('foo').isDefined()

        const result1 = constraint()

        variable.set('foo', 'foo')
        const result2 = constraint()

        expect(result1).toBe(false)
        expect(result2).toBe(true)
    })
})

describe('Variable constraints', () => {
    it('is', () => {
        variable.set('foo', 'foo')
        expect(variable.constraints().variable('foo').is('foo')()).toBe(true)
    })

    it('isDefined', () => {
        variable.set('foo', 'foo')
        expect(variable.constraints().variable('foo').isDefined()()).toBe(true)
    })

    it('isUndefined', () => {
        expect(variable.constraints().variable('foo').isUndefined()()).toBe(true)
    })

    it('isFalsy', () => {
        variable.set('foo', false)
        expect(variable.constraints().variable('foo').isFalsy()()).toBe(true)
    })

    it('isTruthy', () => {
        variable.set('foo', true)
        expect(variable.constraints().variable('foo').isTruthy()()).toBe(true)
    })

    it('isNull', () => {
        variable.set('foo', null)
        expect(variable.constraints().variable('foo').isNull()()).toBe(true)
    })

    it('isNaN', () => {
        variable.set('foo', NaN)
        expect(variable.constraints().variable('foo').isNaN()()).toBe(true)
    })

    it('contain', () => {
        variable.set('foo', ['a', 'b', 'c'])
        expect(variable.constraints().variable('foo').contain('a')()).toBe(true)
    })

    it('equal', () => {
        variable.set('foo', { a: 1, b: [2, 3] })
        const result1 = variable
            .constraints()
            .variable('foo')
            .equal({ a: 1, b: [2, 3] })()
        expect(result1).toBe(true)
    })

    it('match', () => {
        variable.set('foo', 'hello123')
        const result1 = variable
            .constraints()
            .variable('foo')
            .match(/[a-z]+\d+/)()
        expect(result1).toBe(true)
    })
})

describe('Variable triggers', () => {
    let Scenario

    beforeEach(() => {
        Scenario = ComponentHelper.ScenarioAndEvent(variable)
    })

    it('triggers when a variable is updated', () => {
        variable.triggers(Scenario).variable('foobar').is(true)
        variable.event().emit('variable', { name: 'foobar', value: true })
        expect(Scenario.assert).toHaveBeenCalled()
    })

    it('will not trigger if the value does not match', () => {
        variable.triggers(Scenario).variable('foobar').is(false)
        variable.event().emit('variable', { name: 'foobar', value: true })
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('will not trigger if the variable name is different', () => {
        variable.triggers(Scenario).variable('foobar').is(true)
        variable.event().emit('variable', { name: 'foo', value: true })
        expect(Scenario.assert).not.toHaveBeenCalled()
    })

    it('triggers on various string matches', () => {
        variable.triggers(Scenario).variable('foobar').is('true')
        variable.triggers(Scenario).variable('foobar').is('1')
        variable.triggers(Scenario).variable('foobar').is('string')
        variable.triggers(Scenario).variable('foobar').is(123)
        variable.triggers(Scenario).variable('foobar').is(10.23)

        variable.event().emit('variable', { name: 'foobar', value: 'true' })
        variable.event().emit('variable', { name: 'foobar', value: '1' })
        variable.event().emit('variable', { name: 'foobar', value: 'string' })
        variable.event().emit('variable', { name: 'foobar', value: 123 })
        variable.event().emit('variable', { name: 'foobar', value: 10.23 })

        expect(Scenario.assert).toHaveBeenCalledTimes(5)
    })

    it('will trigger if variable updated to anything', () => {
        variable.triggers(Scenario).variable('foobar').updated()

        variable.event().emit('variable', { name: 'foobar', value: true })
        variable.event().emit('variable', { name: 'foobar', value: 'yes' })
        variable.event().emit('variable', { name: 'foobar', value: null })
        variable.event().emit('variable', { name: 'foobar', value: false })
        variable.event().emit('variable', { name: 'foobar', value: 100 })
        variable.event().emit('variable', { name: 'foobar', value: 10.23 })

        expect(Scenario.assert).toHaveBeenCalledTimes(6)
    })

    it('will not trigger updated if variable name is different', () => {
        variable.triggers(Scenario).variable('foobar').updated()
        variable.event().emit('variable', { name: 'foo', value: true })
        expect(Scenario.assert).not.toHaveBeenCalled()
    })
})
