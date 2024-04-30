const logger = require('./../../commons/logger')

/**
 * Scene
 *
 * @class
 */
class Scene {
    /**
     * Scene in the system.
     *
     * @param {Object} parent - The parent component to which this scene belongs.
     * @param {string} name - The name of the scene.
     * @param {Function} callback - The callback function to be executed when the scene runs.
     */
    constructor(parent, name, callback) {
        this.parent = parent
        this.name = name
        this.callback = callback
    }

    /**
     * Runs the scene
     */
    run(...args) {
        logger.info(`Scene "${this.name}" running`, 'scene')
        this.parent.emit('scene.run', this.name)
        return this.callback(...args)
    }
}

module.exports = Scene
