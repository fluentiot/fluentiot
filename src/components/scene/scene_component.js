const Component = require('./../component');
const Scene = require('./scene');

class SceneComponent extends Component {

    /**
     * Initializes the SceneComponent.
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.scenes = {};
    }

    /**
     * Adds a new scene
     * @param {string} name - The name of the scene.
     * @param {Function} callback - The callback function for the scene.
     * @returns {Scene} - The scene object.
     */
    add(name, callback) {
        if(this.scenes[name]) {
            throw new Error(`Scene "${name}" already exists`);
        }
        const newScene = new Scene(this, name, callback);
        this.scenes[name] = newScene;
        return newScene;
    }

    /**
     * Retrieves a scene by its name.
     * @param {string} name - The name of the scene.
     * @returns {*} - The scene object or false if the scene was not found by the name.
     */
    get(name) {
        if(!this.scenes[name]) {
            return false;
        }
        const scene = this.scenes[name];
        return scene;
    }
    
}

module.exports = SceneComponent;
