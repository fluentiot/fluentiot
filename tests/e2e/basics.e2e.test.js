jest.mock('./../../src/logger')
jest.useFakeTimers()

const { Fluent, event, scenario, variable, device } = require('./../../index')

describe('Scenario creation basics', () => {

    beforeEach(() => {
        Fluent.scenarios = {}
        Fluent.inTestMode = false
    })

    it('scenario elements will return the object each time', () => {
        const result1 = scenario('test1')
        const result2 = scenario('test2').when()
        const result3 = scenario('test3').when().empty()
        const result4 = scenario('test4').when().empty().then()
        const result5 = scenario('test5').when().empty().then().constraint()
        const result6 = scenario('test6').when().empty().then().constraint().then()
        const result7 = scenario('test7').when().empty().then().constraint().then().else()
        const result8 = scenario('test8').when().empty().then().constraint().then().else().then()
        const result9 = scenario('test9').when().empty().then().constraint().then().else().then().assert()

        const result20 = scenario.only('test20')

        expect(typeof result1).toBe('object')
        expect(typeof result2).toBe('object')
        expect(typeof result3).toBe('object')
        expect(typeof result4).toBe('object')
        expect(typeof result5).toBe('object')
        expect(typeof result6).toBe('object')
        expect(typeof result7).toBe('object')
        expect(typeof result8).toBe('object')
        expect(typeof result9).toBe('object')

        expect(typeof result20).toBe('object')
    })

    it('actions get called when assert is called', () => {
        const action = jest.fn()

        scenario('test')
            .when()
                .empty()
            .then(() => { action() })
            .assert()

        expect(action).toHaveBeenCalledTimes(1)
    })

    it('scenario will run if an event is emitted', () => {
        const action = jest.fn()

        scenario('event testing scenario')
            .when()
                .event('test').on(true)
            .then(() => { action() })

        event.emit('test', true)

        expect(action).toHaveBeenCalledTimes(1)
    })

    it('scenario can call another scenario', () => {
        const action = jest.fn()

        scenario('first call')
            .when()
                .event('test').on(true)
            .then(() => {
                Fluent.scenario.get('second call').assert()
            })

        scenario('second call')
            .when()
                .empty()
            .then(() => { action() })

        // Trigger first scenario
        event.emit('test', true)

        expect(action).toHaveBeenCalledTimes(1)
    })

    it('prevents scenarios with the same description been created', () => {
        scenario('same description twice')
        expect(() => scenario('same description twice')).toThrow()
    })

    it('scenarios with only will run', () => {
        const action1 = jest.fn()
        const action2 = jest.fn()

        scenario.only('event testing scenario 1')
            .when()
                .event('test').on(true)
            .then(() => { action1() })

        scenario('event testing scenario 2')
            .when()
                .event('test').on(true)
            .then(() => { action2() })

        event.emit('test', true)

        expect(action1).toHaveBeenCalledTimes(1)
        expect(action2).toHaveBeenCalledTimes(0)
    });

    it('prevents double running with suppressFor', () => {
        const action = jest.fn()

        const test = scenario('test', { suppressFor:1000 })
            .when()
                .empty()
            .then(() => action())
        test.assert()
        test.assert()

        expect(action).toHaveBeenCalledTimes(1)
    })

    it('can run multiple times when suppressFor is set to 0', () => {
        const action = jest.fn()

        const test = scenario('test', { suppressFor:0 })
            .when()
                .empty()
            .then(() => action())
        test.assert()
        test.assert()
        test.assert()

        expect(action).toHaveBeenCalledTimes(3)
    })

    it('constraints and else will run', () => {
        const action1 = jest.fn()
        const action2 = jest.fn()
        const action3 = jest.fn()

        const test = scenario('test', { suppressFor:0 })
            .when()
                .empty()
            .constraint()
                .variable('foobar').is(1)
                .then(() => action1())
            .constraint()
                .variable('foobar').is(2)
                .then(() => action2())
            .else()
                .then(() => action3())

        variable.set('foobar', 1)
        test.assert()

        variable.set('foobar', 2)
        test.assert()

        variable.set('foobar', 3)
        test.assert()

        expect(action1).toHaveBeenCalledTimes(1)
        expect(action2).toHaveBeenCalledTimes(1)
        expect(action3).toHaveBeenCalledTimes(1)
    })

    it('will throw an error if properties passed are not allowed ', () => {
        expect(() => scenario('test', { suppressFor:0 }).when().empty().then()).toThrow()
        expect(() => scenario('test', { foobar:0 }).when().empty().then()).toThrow()
    })

})