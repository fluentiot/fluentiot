
jest.mock('./../../../src/utils/logger');
const SceneComponent = require('./../../../src/components/scene/scene_component');

const Fluent = require('./../../../src/fluent');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));

let scene;

beforeEach(() => {
    scene = new SceneComponent(Fluent);
});

describe('Scene', () => {

    it('setup properly', () => {
        expect(scene.Fluent).toBe(Fluent);
        expect(scene.scenes).toEqual({});
    });

    it('can add a scene', () => {
       const result = scene.add('foobar', () => {}); 
       expect(result).toBeInstanceOf(Object);
       expect(scene.get('foobar')).toBe(result);
       expect(scene.scenes.foobar).toBe(result);
    });

    it('cannot add a scene with the same name', () => {
       scene.add('foobar', () => {});
       expect(() => scene.add('foobar', () => {})).toThrow(Error);
    });

    it('returns false if the scene does not exist', () => {
       expect(scene.get('foobar')).toBe(false);
    });

    it('will run the mock when called', () => {
        const mock = jest.fn();
        scene.add('foobar', () => {
            mock();
        });
        scene.get('foobar').run();
        expect(mock).toHaveBeenCalled();
    });

});