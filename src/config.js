const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { dot } = require('./utils')

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
        this.config = this.loadConfig();
    }

    /**
     * Load the configuration from a given file path
     * 
     * @returns {object} - Config object
     */
    loadConfig() {
        try {
            const configFile = this.getConfigFilePath();
            return this.loadConfigFile(configFile);
        } catch (error) {
            throw new Error(`Error loading config: ${error.message}`);
        }
    }

    /**
     * Get the project root directory
     * 
     * @returns {string} - Project root path
     */
    getProjectRoot() {
        return process.cwd();
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
            return projectConfigPath;
        }

        // If not, use the default fluent.config.js from the same directory
        console.warn(`\x1b[33mIt is advised to copy the "fluent.config.js" from the module directory to your local app directory\x1b[0m`)
        return path.join(__dirname, '..', 'fluent.config.js');
    }

    /**
     * Load config file, abstraction useful for testing
     * 
     * @param {string} path - Path to require
     * @returns {object} - Config object
     */
    loadConfigFile(configFile) {
        return require(configFile)
    }

    /**
     * Get a nested property from the configuration file
     * 
     * @param {string} key - Dot notation of the key to fetch from config file
     * @returns {any} - Value of the key
     */
    get(key) {
        if (!this.config) {
            console.log(`Config not loaded`);
            return null;
        }

        const value = dot.get(this.config, key);

        if (value === null) {
            console.log(`Config key "${key}" not found`);
        }

        return value;
    }
}

module.exports = new Config();
module.exports.Config = Config;
