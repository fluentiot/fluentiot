jest.mock('./../../src/logger')
jest.useFakeTimers()

const { Fluent, event, scenario } = require('./../../index')

describe('Scenario creation basics', () => {

    beforeEach(() => {
        Fluent.scenarios = {}
        Fluent.inTestMode = false
    })

    it('emitting an event will pass the parameters to the scenario then method', () => {
        const mockCapture = jest.fn()

        scenario('Pretty colours', { suppressFor: 0 })
            .when()
                .event('colour').on()
            .then((_Scenario, arg1, arg2) => {
                mockCapture(arg1, arg2)
            })

        event.emit('colour', 'a1', 'a2')
        event.emit('colour', 'b1', 'b2')
        event.emit('colour', 'c1', 'c2')

        expect(mockCapture).toHaveBeenCalledTimes(3)
        expect(mockCapture).toHaveBeenNthCalledWith(1, 'a1', 'a2')
        expect(mockCapture).toHaveBeenNthCalledWith(2, 'b1', 'b2')
        expect(mockCapture).toHaveBeenNthCalledWith(3, 'c1', 'c2')
    })

})