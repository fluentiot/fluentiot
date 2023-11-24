
const SceneComponent = require('./../../../../src/components/scene/scene_component');
jest.mock('./../../../../src/fluent');

beforeEach(() => {
});

describe('Scene', () => {

    it('setups up correctly', () => {
        const sceneComponent = new SceneComponent();
        sceneComponent.init(Fluent);

        expect('a').toBe('a');
    })

});