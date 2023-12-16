const config = require('./../config.js')

/**
 * Logger utility
 *
 * @class
 */
class Logger {
    /**
     * Constructor
     */
    constructor() {
        this.types = {
            log: { color: '\x1b[37m', level: 0 },
            info: { color: '\x1b[36m', level: 1 },
            warn: { color: '\x1b[33m', level: 2 },
            error: { color: '\x1b[31m', level: 3 },
            debug: { color: '\x1b[35m', level: 4 },
        }

        // For each log type create a new method
        // Then, logger.debug(); can be called and abstracted to logger._log(...)
        Object.keys(this.types).forEach((type) => {
            this[type] = (...args) => {
                this._log(type, ...args)
            }
        })

        // Load config
        this.config = config.get('logging') || { levels: { default: 'debug' } }
    }

    /**
     * Get current time stamp for logging output
     *
     * @private
     * @returns {string} - Timestamp
     */
    _getCurrentTimestamp() {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
        const month = monthNames[now.getMonth()];
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
    
        return `${month} ${day} ${hours}:${minutes}:${seconds}`;
    }
    

    /**
     * Get the log level
     *
     * @param {string} componentName - Name of the related component
     * @returns
     */
    _getLogLevel(componentName) {
        const configLevels = this.config.levels
        const type = configLevels[componentName] ? configLevels[componentName] : configLevels.default

        //The defined log type in the config file was not correct
        if (!this.types[type]) {
            const timestamp = this._getCurrentTimestamp()
            const coloredType = this.types.error.color + 'ERROR' + '\x1b[0m'
            console.log(`[${timestamp}] [${coloredType}] Your logging level for ${type} is not correct`)
            return this.types.debug.level
        }

        return this.types[type].level
    }

    /**
     * Log
     *
     * @private
     * @param {string} type - Type of log message, info, debug, error, etc.
     * @param {any} message - Text of the log or an object.
     * @param {string} component - Which component or area of the framework is logging.
     */
    _log(type, message, component = 'default') {
        // Exit early if the log level condition is not met
        const logLevel = this._getLogLevel(component);
        if (this.types[type].level > logLevel) {
            return;
        }

        const timestamp = this._getCurrentTimestamp();
        
        const logTypeColour = this.types[type].color
        const logTypeBackground = '\x1b[40m'
        const timeStampColor = '\x1b[37m'
        const componentColor = '\x1b[94m'
        const highlightColor = '\x1b[92m'
        const messageColor = '\x1b[97m'

        // Construct log components
        const logTimestamp = `${timeStampColor}${timestamp}\x1b[0m`;
        const logComponent = `${componentColor}${component}\x1b[0m`
        const logType = `${logTypeBackground}${logTypeColour}${type.toUpperCase()}\x1b[0m`
        
        let logMessage = typeof message === 'object' ? JSON.stringify(message) : message;
        logMessage = `${messageColor}${logMessage}\x1b[0m`

        // Highlight words in quotes with green color
        logMessage = logMessage.replace(/"([^"]*)"/g, `${highlightColor}"$1"\x1b[0m${messageColor}`);

        // Construct the final log string
        const logString = `${logTimestamp} ${logComponent} ${logType} ${logMessage}`;

        console.log(logString);
    }


}

module.exports = new Logger()
