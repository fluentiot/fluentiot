jest.mock('./../../../src/commons/logger')
const SceneComponent = require('./../../../src/components/scene/scene_component')

const Fluent = require('./../../../src/fluent')
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'))

let scene

beforeEach(() => {
    scene = new SceneComponent(Fluent)
})

describe('Scene', () => {
    it('setup properly', () => {
        expect(scene.Fluent).toBe(Fluent)
        expect(scene.scenes).toEqual({})
    })

    it('can add a scene', () => {
        const result = scene.add('foobar', () => {})
        expect(result).toBeInstanceOf(Object)
        expect(scene.get('foobar')).toBe(result)
        expect(scene.scenes.foobar).toBe(result)
    })

    it('cannot add a scene with the same name', () => {
        scene.add('foobar', () => {})
        expect(() => scene.add('foobar', () => {})).toThrow(Error)
    })

    it('throws if scene name is not valid', () => {
        expect(() => scene.add('my name', () => {})).toThrow()
    })

    it('throws if no call back method defined', () => {
        expect(() => scene.add('myName')).toThrow()
    })

    it('returns false if the scene does not exist', () => {
        expect(scene.get('foobar')).toBeNull()
    })

    it('returns false if running a scene that does not exist', () => {
        expect(scene.run('foobar')).toBe(false)
    })

    it('will run the mock when called though get()', () => {
        const mock = jest.fn()
        scene.add('foobar', () => {
            mock()
        })
        scene.get('foobar').run()
        expect(mock).toHaveBeenCalled()
    })

    it('will run the mock through scene.run()', () => {
        const mock = jest.fn()
        scene.add('foobar', () => {
            mock()
        })
        scene.run('foobar')
        expect(mock).toHaveBeenCalled()
    })

    it('passes args to the scene when running', () => {
        const mock = jest.fn()
        scene.add('foobar', (a, b) => {
            mock(a, b)
        })
        scene.run('foobar', 1, 2)

        //Fetch the scene and run it
        const sceneObj = scene.get('foobar')
        sceneObj.run(1, 2)

        expect(mock).toHaveBeenCalledTimes(2)
        expect(mock).toHaveBeenCalledWith(1, 2)
    })

})
