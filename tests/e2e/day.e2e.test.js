jest.mock('./../../src/utils/logger')
jest.useFakeTimers()

const mockdate = require('mockdate')

const { Fluent, event, scenario, variable } = require('./../../index')

describe('Scenario creation basics', () => {

    beforeEach(() => {
        Fluent.scenarios = {}
        Fluent.inTestMode = false
        mockdate.reset()
    })

    it('will run christmas lights if between specified dates', () => {
        const christmasLights = jest.fn()
        const normalLights = jest.fn()

        const _scenario = scenario("Gate lights on")
            .when()
                .empty()
            .constraint()
                .day.between('1st December', '31st December')
                .then(() => christmasLights())
            .else()
                .then(() => normalLights())

        mockdate.set('2023-12-30 12:30:00')
        _scenario.assert()

        expect(christmasLights).toHaveBeenCalledTimes(1)
        expect(normalLights).toHaveBeenCalledTimes(0)
    })

    it('will not run christmas lights if not between specified dated', () => {
        const christmasLights = jest.fn()
        const normalLights = jest.fn()

        const _scenario = scenario("Gate lights on")
            .when()
                .empty()
            .constraint()
                .day.between('1st December', '31st December')
                .then(() => christmasLights())
            .else()
                .then(() => normalLights())

        mockdate.set('2024-01-01 12:30:00')
        _scenario.assert()

        expect(christmasLights).toHaveBeenCalledTimes(0)
        expect(normalLights).toHaveBeenCalledTimes(1)
    })

    it('if dates change the between still works', () => {
        const christmasLights = jest.fn()
        const normalLights = jest.fn()

        const _scenario = scenario("Gate lights on")
            .when()
                .empty()
            .constraint()
                .day.between('1st December', '31st December')
                .then(() => christmasLights())
            .else()
                .then(() => normalLights())

        mockdate.set('2023-12-30 12:30:00')
        _scenario.assert()

        mockdate.set('2024-01-01 12:30:00')
        _scenario.assert()

        expect(christmasLights).toHaveBeenCalledTimes(1)
        expect(normalLights).toHaveBeenCalledTimes(1)
    })

})