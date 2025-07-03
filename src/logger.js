const winston = require('winston')
const { format } = require('winston')
const fs = require('fs');
const path = require('path');
const config = require('./config')

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

        // Entity logs storage - Map for O(1) lookup
        this.entityLogs = new Map() // Key: entityType:entityName, Value: Array of log entries
        this.maxEntityLogs = 100    // Max logs per entity
        this.logRetentionDays = 7   // Auto-cleanup logs older than this

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

        // Winston logger
        this.winston = this._createLogger()

        // Load config
        this.config = config.get('logging') || { levels: { default: 'debug' } }

        // Start cleanup timer for entity logs
        this._startLogCleanup()
    }


    /**
     * Create a Winston logger
     * 
     * @returns {winston.Logger} - Winston logger
     */
    _createLogger() {
        const transports = [new winston.transports.Console()];

        const fileConfig = config.get('logging.file');
        if (fileConfig?.enabled) {
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
     * @param {Object} [entityObject] - Entity object for entity-aware logging
     * @param {Object} [metadata] - Additional metadata for the log entry
     */
    _log(type, message, component = 'default', entityObject = null, metadata = {}) {
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

        // Create log entry with entity information if provided
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: type,
            message: logMessage,
            component: component,
            ...(entityObject && {
                entityType: component,
                entityName: entityObject.name,
                entityId: entityObject.id || `${component}_${entityObject.name}_${Date.now()}`,
                metadata: metadata
            })
        };

        // Store entity log if entity object provided
        if (entityObject && entityObject.name) {
            this._storeEntityLog(component, entityObject.name, logEntry);
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
    
    /**
     * Store entity log entry
     * 
     * @param {string} entityType - Type of entity (device, room, scene, scenario)
     * @param {string} entityName - Name of the entity
     * @param {Object} logEntry - Log entry to store
     * @private
     */
    _storeEntityLog(entityType, entityName, logEntry) {
        const key = `${entityType}:${entityName}`;
        
        if (!this.entityLogs.has(key)) {
            this.entityLogs.set(key, []);
        }
        
        const logs = this.entityLogs.get(key);
        logs.push(logEntry);
        
        // Maintain max logs per entity
        if (logs.length > this.maxEntityLogs) {
            logs.shift(); // Remove oldest log
        }
    }

    /**
     * Get entity logs with optional filters
     * 
     * @param {string} entityType - Type of entity
     * @param {string} entityName - Name of the entity
     * @param {Object} [filters={}] - Filters to apply
     * @param {number} [filters.limit] - Limit number of results
     * @param {string} [filters.level] - Filter by log level
     * @param {Date} [filters.since] - Filter logs since this date
     * @returns {Array} - Array of log entries
     */
    getEntityLogs(entityType, entityName, filters = {}) {
        const key = `${entityType}:${entityName}`;
        let logs = this.entityLogs.get(key) || [];
        
        // Apply filters
        if (filters.level) {
            logs = logs.filter(log => log.level === filters.level);
        }
        
        if (filters.since) {
            logs = logs.filter(log => new Date(log.timestamp) >= filters.since);
        }
        
        // Sort by timestamp (newest first)
        logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        if (filters.limit) {
            logs = logs.slice(0, filters.limit);
        }
        
        return logs;
    }

    /**
     * Get entity log statistics
     * 
     * @param {string} entityType - Type of entity
     * @param {string} entityName - Name of the entity
     * @returns {Object} - Log statistics
     */
    getEntityLogStats(entityType, entityName) {
        const key = `${entityType}:${entityName}`;
        const logs = this.entityLogs.get(key) || [];
        
        const stats = {
            total: logs.length,
            byLevel: {
                error: 0,
                warn: 0,
                info: 0,
                debug: 0
            },
            lastLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
            firstLog: logs.length > 0 ? logs[0].timestamp : null
        };
        
        logs.forEach(log => {
            if (stats.byLevel.hasOwnProperty(log.level)) {
                stats.byLevel[log.level]++;
            }
        });
        
        return stats;
    }

    /**
     * Start automatic cleanup of old entity logs
     * 
     * @private
     */
    _startLogCleanup() {
        // Run cleanup every hour
        setInterval(() => {
            this._cleanupOldLogs();
        }, 60 * 60 * 1000);
        
        // Run initial cleanup
        this._cleanupOldLogs();
    }

    /**
     * Clean up old entity logs based on retention policy
     * 
     * @private
     */
    _cleanupOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);
        
        for (const [key, logs] of this.entityLogs.entries()) {
            const filteredLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
            
            if (filteredLogs.length !== logs.length) {
                if (filteredLogs.length === 0) {
                    this.entityLogs.delete(key);
                } else {
                    this.entityLogs.set(key, filteredLogs);
                }
            }
        }
    }

    /**
     * Get all entity types that have logs
     * 
     * @returns {Array} - Array of entity types
     */
    getLoggedEntityTypes() {
        const types = new Set();
        for (const key of this.entityLogs.keys()) {
            const [entityType] = key.split(':');
            types.add(entityType);
        }
        return Array.from(types);
    }

    /**
     * Get all entities of a specific type that have logs
     * 
     * @param {string} entityType - Type of entity
     * @returns {Array} - Array of entity names
     */
    getLoggedEntities(entityType) {
        const entities = [];
        for (const key of this.entityLogs.keys()) {
            const [type, name] = key.split(':');
            if (type === entityType) {
                entities.push(name);
            }
        }
        return entities;
    }

    /**
     * Clear all entity logs
     */
    clearEntityLogs() {
        this.entityLogs.clear();
    }

    /**
     * Clear logs for a specific entity
     * 
     * @param {string} entityType - Type of entity
     * @param {string} entityName - Name of the entity
     */
    clearEntityLog(entityType, entityName) {
        const key = `${entityType}:${entityName}`;
        this.entityLogs.delete(key);
    }
    
}

module.exports = new Logger()
