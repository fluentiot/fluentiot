jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))
jest.mock('./../../../src/logger')

const Component = require('./../../../src/components/component')
const BurgerComponent = require('./../../components/burger/burger_component')
const Fluent = require('./../../../src/fluent')


describe('Component', () => {

    let mockEmit

    beforeAll(() => {
        mockEmit = jest.fn()

        Fluent._component = () => {
            return {
                get: (name) => {
                    if(name === 'foo') {
                        return 'bar'
                    }
                    else if(name === 'event') {
                        const event = new Object();
                        event.emit = mockEmit;
                        event.on = (...args) => {};
                        return event;
                    }
                }
            }
        }
        Fluent._event = null
    })

    it('can construct', () => {
        const component = new BurgerComponent(Fluent)
        expect(component).toBeInstanceOf(BurgerComponent)
        expect(component.Fluent).toBeDefined()
        expect(component._event).toBeNull()
    })

    it('throws if instantiated directly', () => {
        expect(() => new Component()).toThrow()
    })

    it('can get a component', () => {
        const component = new BurgerComponent(Fluent)
        const result = component.getComponent('foo')
        expect(result).toBe('bar')
    })

    it('can get event and will cache it', () => {
        const component = new BurgerComponent(Fluent)
        const event = component.event()
        expect(event).toBeDefined()
        expect(Fluent._event).toBeDefined()
    })

    it('can emit an event', () => {
        const component = new BurgerComponent(Fluent)
        component.emit('foo', 'bar')
        expect(mockEmit).toHaveBeenCalledWith('foo', 'bar')
    })

    it('will teardown component', () => {
        const component = new BurgerComponent(Fluent)
        component.teardown()
        expect(component._event).toBeNull()
    })

})