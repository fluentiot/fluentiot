const path = require('path')
const fs = require('fs')
const logger = require('./utils/logger')

/**
 * Config
 *
 * @class
 */
class Config {
    /**
     * Constructor
     */
    constructor() {
        this.config = this.loadConfig()
    }

    /**
     * Load the configuration from a given file path
     *
     * @returns {object} - Config object
     */
    loadConfig() {
        try {
            return require(this.getConfigFilePath())
        } catch (error) {
            throw new Error(`Error loading config: ${error.message}`)
        }
    }

    /**
     * Get the project root directory
     *
     * @returns {string} - Project root path
     */
    getProjectRoot() {
        return process.cwd()
    }

    /**
     * Get the configuration file path
     *
     * @returns {string} - Configuration file path
     */
    getConfigFilePath() {
        // Check if fluent.config.js exists in the project root
        const projectConfigPath = path.join(this.getProjectRoot(), 'fluent.config.js')
        if (fs.existsSync(projectConfigPath)) {
            return projectConfigPath
        }

        // If not, use the default fluent.config.js from the same directory
        return path.join(__dirname, '..', 'fluent.config.js')
    }

    /**
     * Get a nested property from the configuration file
     *
     * @param {string} key - Basic two-level dot notation of the key to fetch from config file
     * @returns
     */
    get(key) {
        if (!this.config) {
            logger.error(`Config not loaded`, 'core')
            return null
        }

        const keys = key.split('.')
        let value = this.config

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k]
            } else {
                logger.warn(`Config key "${key}" not found`, 'core')
                return null
            }
        }

        return value
    }
}

module.exports = new Config()
