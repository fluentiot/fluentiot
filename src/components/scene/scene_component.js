/**
 * Scene Component for Fluent IoT
 * 
 * (C) 2023 Darren Moore
 * MIT LICENCE
 */
const Scene = require('./scene');

class SceneComponent {

    /**
     * Initializes the SceneComponent.
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');

        /** @type {Object.<string, Scene>} */
        this.scenes = {};
    }

    /**
     * Adds a new scene
     * @param {string} name - The name of the scene.
     * @param {Function} callback - The callback function for the scene.
     */
    add(name, callback) {
        const newScene = new Scene(this.Event, name, callback);
        this.scenes[name] = newScene;
    }

    /**
     * Retrieves a scene by its name.
     * @param {string} name - The name of the scene.
     * @returns {Scene} - The scene object.
     */
    get(name) {
        const scene = this.scenes[name];
        return scene;
    }
    
}

module.exports = SceneComponent;
