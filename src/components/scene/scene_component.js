const Component = require('./../component')
const Scene = require('./scene')
const logger = require('./../../utils/logger')

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
        super(Fluent)
        this.scenes = {}
    }

    /**
     * Adds a new scene
     *
     * @param {string} name - The name of the scene.
     * @param {Function} callback - The callback function for the scene.
     * @returns {Scene} - The scene object.
     */
    add(name, callback) {
        if (this.scenes[name]) {
            throw new Error(`Scene with the name "${name}" already exists`)
        }
        if (!callback) {
            throw new Error(`Scene "${name}" requires a callback method`)
        }
        this.scenes[name] = new Scene(this, name, callback)
        return this.scenes[name]
    }

    /**
     * Gets the scene with the specified name.
     *
     * @param {string} name - The name of the scene.
     * @returns {any|null} - Returns the scene.
     */
    get(name) {
        if (!this.scenes[name]) {
            logger.error(`Scene "${name}" could not be found`, 'scene')
            return null
        }
        return this.scenes[name]
    }

    /**
     * Run a scene by name.
     *
     * @param {string} name - The name of the scene.
     * @returns {any|boolean} - Return from the callback
     */
    run(name) {
        const scene = this.get(name)
        if (!scene) {
            logger.error(`Scene "${name}" not found and cannot be run`, 'scene')
            return false
        }
        return scene.run()
    }
}

module.exports = SceneComponent
