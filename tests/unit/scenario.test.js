
jest.mock('./../../src/commons/logger')
const logger = require('./../../src/commons/logger')

const mockdate = require('mockdate')
const dayjs = require('dayjs')

const EventEmitter = require('events')
class MyEmitter extends EventEmitter {}
const event = new MyEmitter()

const Scenario = require('./../../src/scenario')

let Fluent

beforeEach(() => {
    const foobarComponent = new Object()
    foobarComponent.triggers = (scope) => {
        return {
            foobar: () => {
                return {
                    onEvent: (eventName) => {
                        event.on(eventName, () => {
                            scope.assert(eventName)
                        })
                        return scope
                    },
                }
            },
        }
    }
    foobarComponent.constraints = (Scenario, constraints) => {
        return {
            foobar: () => {
                return {
                    isTrue: (value) => {
                        return () => value === true
                    },
                }
            },
            noneFunction: {
                isTrue: (value) => {
                    return () => value === true
                },
            },
            noFunctionReturn: {
                isTrue: (value) => {
                    return () => value === true
                },
            },
        }
    }

    const components = {
        foobar: foobarComponent,
    }

    const mockFluent = jest.fn()
    Fluent = new mockFluent()
    Fluent.updateTestMode = jest.fn()
    Fluent.component = {
        list: () => components,
    }
})

describe('Creating basic scenarios', () => {
    it('is setup correctly', () => {
        const scenario = new Scenario(Fluent, 'Foobar')

        expect(scenario).toBeInstanceOf(Scenario)
        expect(scenario.description).toBe('Foobar')

        //Available scope
        expect(scenario.triggers.empty).toBeDefined()
        expect(scenario.triggers.constraint).toBeDefined()
        expect(scenario.triggers.then).toBeDefined()
        expect(scenario.triggers.foobar).toBeDefined()
    })

    it('returns the correct scope of available functions', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
        const when = scenario.when()
        const empty = when.empty()
        const then = empty.then(mockCallback)
        const result = then._assert()

        //Scenario was asserted
        expect(result).toBe(true)
        expect(mockCallback.mock.calls).toHaveLength(1)

        //Available scope
        expect(when.empty).toBeDefined()
        expect(when.constraint).toBeDefined()
        expect(when.then).toBeDefined()

        expect(empty.empty).toBeDefined()
        expect(empty.constraint).toBeDefined()
        expect(empty.then).toBeDefined()
    })

    it('can handle direct calls or none-direct calls to assert', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar', { suppressFor:0 }).when().empty().then(mockCallback).assert()
        const result = scenario._assert()

        expect(scenario).toBeInstanceOf(Scenario)
        expect(result).toBe(true)
        expect(mockCallback.mock.calls).toHaveLength(2)
    })

    it('fails to run if the scenario is not runnable', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar').when().empty().then(mockCallback)

        scenario.runnable = false
        const result = scenario._assert()

        expect(mockCallback.mock.calls).toHaveLength(0)
        expect(result).toBe(false)
    })

    it('gets triggered with assert and parameters are passed', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar').when().empty().then(mockCallback)
        scenario.assert('foobar result')
        expect(mockCallback).toHaveBeenCalledWith(scenario, 'foobar result')
    })

    it('gets triggered and the callback receives scenario and the assert object', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar').when().empty().then(mockCallback)
        scenario.assert({ a: 'b' })
        expect(mockCallback).toHaveBeenCalledWith(scenario, { a: 'b' })
    })

    it('fails to run if there are no triggers', () => {
        const scenario = new Scenario(Fluent, 'Foobar')
        const result = scenario._assert()
        expect(result).toBe(false)
    })

    it('it throws if missing Fluent or description', () => {
        expect(() => new Scenario()).toThrow(Error)
        expect(() => new Scenario(Fluent)).toThrow(Error)
    })

    it('it throws if the trigger is not not found', () => {
        expect(() => new Scenario().when().foo()).toThrow(Error)
    })

    it('it throws if the component is not found', () => {
        expect(() => new Scenario().when().empty().constraint().bar()).toThrow(Error)
    })
})

describe('Constraints', () => {
    it('successfully calls a basic constraint and the callback is called', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(true)
            .then(mockCallback)

        const result = scenario._assert()

        expect(mockCallback.mock.calls).toHaveLength(1)
        expect(result).toBe(true)
    })

    it('constraints are never called', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar').when().empty().constraint().foobar().isTrue(true).then(mockCallback)

        expect(mockCallback.mock.calls).toHaveLength(0)
    })

    it('calls two constraints and runs', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(true)
            .foobar()
            .isTrue(true)
            .then(mockCallback)

        const result = scenario._assert()

        expect(mockCallback.mock.calls).toHaveLength(1)
        expect(result).toBe(true)
    })

    it('calls constraint that is not a function but object', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .noneFunction.isTrue(true)
            .then(mockCallback)

        const result = scenario._assert()

        expect(mockCallback.mock.calls).toHaveLength(1)
        expect(result).toBe(true)
    })

    it('it fails the constraint and does not call the callback', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback)

        const result = scenario._assert()

        expect(mockCallback.mock.calls).toHaveLength(0)
        expect(result).toBe(false)
    })

    it('handles multiple constraint groups and only one will callback', () => {
        const mockCallback1 = jest.fn()
        const mockCallback2 = jest.fn()
        const mockCallback3 = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback1)
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback2)
            .constraint()
            .foobar()
            .isTrue(true)
            .then(mockCallback3)

        const result = scenario._assert()

        expect(mockCallback1.mock.calls).toHaveLength(0)
        expect(mockCallback2.mock.calls).toHaveLength(0)
        expect(mockCallback3.mock.calls).toHaveLength(1)

        expect(result).toBe(true)
    })

    it('handles multiple positive multiple constraint groups and will run them', () => {
        const mockCallback1 = jest.fn()
        const mockCallback2 = jest.fn()
        const mockCallback3 = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback1)
            .constraint()
            .foobar()
            .isTrue(true)
            .then(mockCallback2)
            .constraint()
            .foobar()
            .isTrue(true)
            .then(mockCallback3)

        const result = scenario._assert()

        expect(mockCallback1.mock.calls).toHaveLength(0)
        expect(mockCallback2.mock.calls).toHaveLength(1)
        expect(mockCallback3.mock.calls).toHaveLength(1)

        expect(result).toBe(true)
    })

    it('will fall back to an else constraint if other constraints are negative', () => {
        const mockCallback1 = jest.fn()
        const mockCallback2 = jest.fn()
        const mockCallback3 = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
            .empty()
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback1)
            .constraint()
            .foobar()
            .isTrue(false)
            .then(mockCallback2)
            .else()
            .then(mockCallback3)

        const result = scenario._assert()

        expect(mockCallback1.mock.calls).toHaveLength(0)
        expect(mockCallback2.mock.calls).toHaveLength(0)
        expect(mockCallback3.mock.calls).toHaveLength(1)

        expect(result).toBe(true)
    })

    it('will make sure else is not called if a constraint group is positive', () => {
        const mockCallback1 = jest.fn()
        const mockCallback2 = jest.fn()
        const mockCallback3 = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .constraint()
                .foobar().isTrue(false)
                .then(mockCallback1)
            .constraint()
                .foobar().isTrue(true)
                .then(mockCallback2)
            .else()
                .then(mockCallback3)

        scenario.assert()

        expect(mockCallback1.mock.calls).toHaveLength(0)
        expect(mockCallback2.mock.calls).toHaveLength(1)
        expect(mockCallback3.mock.calls).toHaveLength(0)
    })
})

describe('Triggers', () => {
    it('will not run if the when() is not triggered', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar').when().foobar().onEvent('hey').then(mockCallback)

        expect(mockCallback.mock.calls).toHaveLength(0)
    })

    it('will trigger if the when() is triggered', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar').when().foobar().onEvent('hey').then(mockCallback)

        event.emit('hey')

        expect(mockCallback.mock.calls).toHaveLength(1)
    })

    it('will handle custom triggers', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar')
            .when((Scenario) => {
                event.on('pop', () => {
                    Scenario.assert('pop')
                })
                return Scenario.triggers
            })
            .then(mockCallback)

        event.emit('pop')

        expect(mockCallback.mock.calls).toHaveLength(1)
    })

    it('will handle two triggers for two different events acting as an OR', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar', { suppressFor:0 })
            .when()
                .foobar().onEvent('foo')
                .foobar().onEvent('bar')
            .then(mockCallback)

        event.emit('foo') //Assert
        event.emit('bar') //Assert
        event.emit('hey') //None

        expect(mockCallback.mock.calls).toHaveLength(2)
    })

    test('will put the scenario into test mode in the DSL', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar', { only:true })
            .when()
                .empty()
            .then(mockCallback)

        expect(scenario.testMode).toBe(true)
    })
})


describe('Scenario suppressFor', () => {

    afterEach(() => {
        mockdate.reset()
    })

    it('will use the default suppressFor to 1000', () => {
        const scenario1 = new Scenario(Fluent, 'Foobar')
        expect(scenario1.properties.suppressFor).toBe(1000)
    })

    it('will set the suppressFor when creating a scenario', () => {
        const scenario1 = new Scenario(Fluent, 'Foobar', { suppressFor:500 })
        expect(scenario1.properties.suppressFor).toBe(500)

        const scenario2 = new Scenario(Fluent, 'Foobar', { suppressFor:'1 minute' })
        expect(scenario2.properties.suppressFor).toBe(60000)

        const scenario3 = new Scenario(Fluent, 'Foobar', { suppressFor:0 })
        expect(scenario3.properties.suppressFor).toBe(0)
    })

    it('will update suppressFor with valid syntax', () => {
        const scenario = new Scenario(Fluent, 'Foobar')

        scenario.suppressFor('500')
        expect(scenario.properties.suppressFor).toBe(500)

        scenario.suppressFor('500 ms')
        expect(scenario.properties.suppressFor).toBe(500)

        scenario.suppressFor('1 minute')
        expect(scenario.properties.suppressFor).toBe(60000)

        scenario.suppressFor('1 min')
        expect(scenario.properties.suppressFor).toBe(60000)

        scenario.suppressFor('1 second')
        expect(scenario.properties.suppressFor).toBe(1000)

        scenario.suppressFor('20hours')
        expect(scenario.properties.suppressFor).toBe(72000000)
    })

    it('will throw error if suppressFor is invalid', () => {
        const scenario = new Scenario(Fluent, 'Foobar')
        expect(() => scenario.suppressFor('foobar')).toThrow(Error)
    })

    it('will not double trigger if two triggers are close to each other', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar')
            .when()
                .foobar().onEvent('hey')
                .foobar().onEvent('hey')
            .then(mockCallback)

        event.emit('hey')

        expect(mockCallback.mock.calls).toHaveLength(1)
    })

    it('can trigger multiple times if suppressFor is set to 0', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar', { suppressFor:0 })
            .when()
                .foobar().onEvent('hey')
                .foobar().onEvent('hey')
            .then(mockCallback)

        event.emit('hey')

        expect(mockCallback.mock.calls).toHaveLength(2)
    })

    it('will trigger when met period', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar', { suppressFor:60000 })
            .when()
                .foobar().onEvent('hey')
            .then(mockCallback)

        // Try to trigger twice, only one should trigger
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        // Move time forward and trigger again
        mockdate.set(dayjs().add(59, 'seconds'));
        event.emit('hey') // Do not trigger

        // Move time forward and trigger again
        mockdate.set(dayjs().add(1, 'seconds'));
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        expect(mockCallback.mock.calls).toHaveLength(2)
    })

    it('will suppress for 12 hours using verbose time', () => {
        const mockCallback = jest.fn()

        new Scenario(Fluent, 'Foobar', { suppressFor: '12 hour' })
            .when()
                .foobar().onEvent('hey')
            .then(mockCallback)

        // Try to trigger twice, only one should trigger
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        // Move time forward before 12 hours and trigger again
        mockdate.set(dayjs().add(11, 'hours'));
        event.emit('hey') // Do not trigger

        // Move time forward and trigger again
        mockdate.set(dayjs().add(1, 'hours'));
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        expect(mockCallback.mock.calls).toHaveLength(2)
    })

    it('will suppress even when one scenario calling another', () => {
        const mockCallback = jest.fn()

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .then(mockCallback)

        new Scenario(Fluent, 'Foobar', { suppressFor: '10 minutes' })
            .when()
                .foobar().onEvent('hey')
            .then(() => {
                scenario.assert()
            })

        // Try to trigger twice, only one should trigger
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        // Move time forward and trigger again
        mockdate.set(dayjs().add(10, 'minutes'));
        event.emit('hey') // Trigger
        event.emit('hey') // Do not trigger

        expect(mockCallback.mock.calls).toHaveLength(2)
    })

})


describe('Scenario lastAssertTime', () => {

    it('lastAssertTime will not update if no constraints were met', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .constraint()
                .foobar().isTrue(false)
                .then(mockCallback)

        expect(scenario._assert()).toBe(false)
        expect(scenario.lastAssertTime).toBe(null)
        expect(mockCallback).not.toHaveBeenCalled()
    })

    it('lastAssertTime updates if constraints were met', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .constraint()
                .foobar().isTrue(true)
                .then(mockCallback)

        expect(scenario._assert()).toBe(true)
        expect(scenario.lastAssertTime).not.toBe(null)
        expect(mockCallback).toHaveBeenCalled()
    })

    it('lastAssertTime updates if no constraints defined', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .then(mockCallback)

        expect(scenario._assert()).toBe(true)
        expect(scenario.lastAssertTime).not.toBe(null)
        expect(mockCallback).toHaveBeenCalled()
    })

    it('lastAssertTime updates if else constraint is called', () => {
        const mockCallback = jest.fn()
        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .constraint()
                .foobar().isTrue(false)
                .then(() => {})
            .else()
                .then(mockCallback)

        expect(scenario._assert()).toBe(true)
        expect(scenario.lastAssertTime).not.toBe(null)
        expect(mockCallback).toHaveBeenCalled()
    })

})


describe('Scenario prevent crashing', () => {

    it('returns false if the scenario then() has errors', () => {
        const spyError = jest.spyOn(logger, 'error')
        const mockDevice = () => { return null }

        const scenario = new Scenario(Fluent, 'Foobar')
            .when()
                .empty()
            .then(() => {
                const device = mockDevice()
                device.noSuchMethod()
            })

        const result = scenario._assert()

        expect(result).toBe(false)
        expect(spyError).toHaveBeenCalled()
    })

})
