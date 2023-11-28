const Component = require('./../component');
const Scene = require('./scene');
const logger = require('./../../utils/logger');

/**
 * Scene component
 *
 * @extends Component
 * @class
 */
class SceneComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.scenes = {};
    }

    /**
     * Adds a new scene
     * 
     * @param {string} name - The name of the scene.
     * @param {Function} callback - The callback function for the scene.
     * @returns {Scene} - The scene object.
     */
    add(name, callback) {
        if(this.scenes[name]) {
            throw new Error(`Scene with the name "${name}" already exists`);
        }
        const newScene = new Scene(this, name, callback);
        this.scenes[name] = newScene;
        return newScene;
    }

    /**
     * Gets the scene with the specified name.
     * 
     * @param {string} name - The name of the scene.
     * @returns {*} - The scene object or false if the scene was not found by the name.
     */
    get(name) {
        if(!this.scenes[name]) {
            logger.error(`Device "${name}" could not be found`, 'device');
            return null;
        }
        return this.scenes[name];
    }
    
}

module.exports = SceneComponent;
