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
        this._ignored = []  // Array of log messages to ignore
        this._only = []     // Array of log messages to only show

        // Types of log messages
        this.types = {
            error: { color: '\x1b[31m', level: 0 },
            log: { color: '\x1b[37m', level: 0 },
            info: { color: '\x1b[36m', level: 1 },
            warn: { color: '\x1b[33m', level: 2 },
            debug: { color: '\x1b[35m', level: 3 },
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
     * Method to ignore log messages by a regular expression
     * 
     * @param {string} regex - Regular expression to match against log messages
     * @param {string} [component=null] - Component to ignore log messages from
     */
    ignore(regex, component = null) {
        this._ignored.push({ regex, component })
    }

    /**
     * Method to only show log messages by a regular expression
     * 
     * @param {string} regex - Regular expression to match against log messages
     * @param {string} [component=null] - Component to only show log messages from
     */
    only(regex, component = null) {
        this._only.push({ regex, component })
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

        // Construct log components
        const logTimestamp = `${timeStampColor}${timestamp}\x1b[0m`;
        const logComponent = `${componentColor}${component}\x1b[0m`
        const logType = `${logTypeBackground}${logTypeColour}${type.toUpperCase()}\x1b[0m`

        // Message
        let logMessage;
        if (message instanceof Error) {
            logMessage = `${message.message}\n${message.stack}`
        } else if(typeof message === 'object') {
            logMessage = JSON.stringify(message)
        } else {
            logMessage = message
        }

        // Check if the message should be ignored or only
        if (!(message instanceof Error)) {
            // Check if the message should be ignored
            const ignore = this._ignored.some((ignore) => {
                const regex = new RegExp(ignore.regex);
                return regex.test(logMessage);
            });
            if (ignore) { return }

            // Check if the message should be only
            if(this._only.length > 0) {
                const only = this._only.some((only) => {
                    const regex = new RegExp(only.regex)
                    return regex.test(logMessage)
                })
                if (!only) { return }
            }
        }

        // Format the log message
        logMessage = this._formatLogMessage(logMessage)

        // Construct the final log string
        const logString = `${logTimestamp} ${logComponent} ${logType} ${logMessage}`;

        console.log(logString);
    }

    /**
     * Formats a log message, highlighting JSON strings and quoted strings.
     *
     * @param {string} message - The log message to format.
     * @returns {string} The formatted log message with highlighted JSON and quotes.
     */
    _formatLogMessage(message) {
        let formattedMessage = ''
        let insideQuotes = false
        let insideJson = false
        let jsonDepth = 0
    
        // Escape sequences for colors
        const reset = '\x1b[0m';
        const white = '\x1b[97m';
        const jsonColor = '\x1b[38;5;208m'; // Magenta
        const quoteColor = '\x1b[92m'; // Cyan
    
        // Iterate over each character
        for (let i = 0; i < message.length; i++) {
            const char = message[i];
            if (char === '{' && !insideQuotes) {
                insideJson = true;
                jsonDepth++;
                formattedMessage += jsonColor + char;
            } else if (char === '}' && !insideQuotes) {
                jsonDepth--;
                if(jsonDepth === 0) { insideJson = false; }
                formattedMessage += jsonColor + char;
            } else if (char === '"' && !insideJson) {
                insideQuotes = !insideQuotes;
                formattedMessage += quoteColor + char;
            } else {
                formattedMessage += insideJson || insideQuotes ? char : white + char;
            }
        }
    
        return formattedMessage + reset;
    }
    

      
      

}

module.exports = new Logger()
