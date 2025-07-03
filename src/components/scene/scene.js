const logger = require('./../../logger')
const LoggingMixin = require('./../_mixins/logging_mixin')

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

        // Mixins
        Object.assign(this, LoggingMixin(this, 'scene'))

        // Auto-log scene creation
        logger.info(`Scene "${name}" created`, 'scene', this)
    }

    /**
     * Runs the scene
     */
    run(...args) {
        logger.info(`Scene "${this.name}" activated and running`, 'scene', this)
        this.parent.emit('scene.run', this.name)
        try {
            const result = this.callback(...args);
            logger.debug(`Scene "${this.name}" execution completed successfully`, 'scene', this);
            return result;
        } catch (error) {
            logger.error(`Scene "${this.name}" execution failed: ${error.message}`, 'scene', this, { error: error.stack });
            throw error;
        }
    }

    /**
     * Describe the scene
     * 
     * @returns {object} Description object with name and type
     */
    describe() {
        return {
            name: this.name,
            type: 'scene',
            recentLogs: this.log.recent(5),
            logStats: this.log.stats
        }
    }
}

module.exports = Scene
