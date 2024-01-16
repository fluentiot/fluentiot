const winston = require('winston')
const { format } = require('winston');
const fs = require('fs');
const path = require('path');
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

        // Winston logger
        this.winston = this._createLogger();

        // Types of log messages
        this.types = {
            error: { color: '\x1b[31m', level: 0 },
            warn: { color: '\x1b[33m', level: 1 },
            info: { color: '\x1b[36m', level: 2 },
            http: { color: '\x1b[35m', level: 3 },
            verbose: { color: '\x1b[35m', level: 4 },
            debug: { color: '\x1b[35m', level: 5 },
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
     * Create a Winston logger
     * 
     * @returns {winston.Logger} - Winston logger
     */
    _createLogger() {
        const transports = [new winston.transports.Console()];

        const fileConfig = config.get('logging.file');
        if (fileConfig.enabled) {
            // Ensure the log directory exists
            const logDir = path.dirname(fileConfig.filename);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            transports.push(new winston.transports.File({
                filename: fileConfig.filename,
                maxsize: fileConfig.maxsize,
                maxFiles: fileConfig.maxFiles,
                format: format.combine(
                    winston.format.timestamp({ format: 'MMM DD HH:mm:ss' }),
                    winston.format.printf(({ level, message, timestamp, component, type }) => {
                        return `${timestamp} ${component} ${level} ${message}`;
                    })
                ),
            }));
        }

        return winston.createLogger({
            level: config.get('logging.levels.default') || 'debug',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'MMM DD HH:mm:ss' }),
                winston.format.printf(({ level, message, timestamp, component }) => {
                    const _message = this._formatLogMessage(message)
                    const _component = this._formatComponent(component)
                    const _type = this._formatType(level)
                    return `${timestamp} ${_component} ${_type} ${_message}`;
                })
            ),
            transports,
        });
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

        // Parse the message depending on what type it is
        let logMessage = this._parseMessage(message)

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

        this.winston.log({
            level: type,
            message: logMessage,
            component: component
        });
    }

    /**
     * Parse message
     * 
     * @param {any} message - Message to parse
     * @returns {string} - Parsed message
     * @private
     */
    _parseMessage(message) {
        // recursively parse each element of the array and call back this method
        if (Array.isArray(message)) {
            return message.map((element) => this._parseMessage(element)).join(' ')
        }

        // parse the message depending on what type it is
        let result
        if (message instanceof Error) {
            result = `${message.message}\n${message.stack}`
        } else if(typeof message === 'object') {
            result = JSON.stringify(message)
        } else {
            result = message
        }
        return result
    }

    /**
     * Format type
     * 
     * @param {string} type
     * @returns {string} - Formatted string
     * @private
     */
    _formatType(type) {
        return this.types[type].color + type.toUpperCase() + '\x1b[0m'
    }

    /**
     * Format component
     * 
     * @param {string} component 
     * @returns {string} - Formatted string
     * @private
     */
    _formatComponent(component) {
        return `\x1b[94m${component}\x1b[0m`
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
