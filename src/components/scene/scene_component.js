const Component = require('./../component')
const Scene = require('./scene')
const logger = require('./../../logger')
const { validation } = require('./../../utils')
const { QueryDslMixin } = require('./../_mixins/query_dsl')

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

        // Mixins
        Object.assign(this, QueryDslMixin(this, this.scenes))
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
        if (!validation.isValidName(name)) {
            throw new Error(`Scene name "${name} is not valid`);
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
     * @param {any} args - Arguments to pass to the scene.
     * @returns {any|boolean} - Return from the callback
     */
    run(name, ...args) {
        const scene = this.get(name)
        if (!scene) {
            logger.error(`Scene "${name}" not found and cannot be run`, 'scene')
            return false
        }
        return scene.run(...args)
    }
}

module.exports = SceneComponent
