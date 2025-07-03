const logger = require('../../logger');

/**
 * Logging Mixin - Provides entity-aware logging functionality
 * 
 * @param {Object} parent - The parent entity object
 * @param {string} entityType - Type of entity (device, room, scene, scenario)
 * @returns {Object} - Logging interface for the entity
 */
const LoggingMixin = (parent, entityType) => {
    return {
        log: {
            /**
             * Log info message for this entity
             * @param {string} message - Log message
             * @param {Object} [metadata={}] - Additional metadata
             */
            info: (message, metadata = {}) => {
                logger.info(message, entityType, parent, metadata);
            },

            /**
             * Log warning message for this entity
             * @param {string} message - Log message
             * @param {Object} [metadata={}] - Additional metadata
             */
            warn: (message, metadata = {}) => {
                logger.warn(message, entityType, parent, metadata);
            },

            /**
             * Log error message for this entity
             * @param {string} message - Log message
             * @param {Object} [metadata={}] - Additional metadata
             */
            error: (message, metadata = {}) => {
                logger.error(message, entityType, parent, metadata);
            },

            /**
             * Log debug message for this entity
             * @param {string} message - Log message
             * @param {Object} [metadata={}] - Additional metadata
             */
            debug: (message, metadata = {}) => {
                logger.debug(message, entityType, parent, metadata);
            },

            /**
             * Get all logs for this entity
             * @returns {Array} - Array of log entries
             */
            get logs() {
                return logger.getEntityLogs(entityType, parent.name);
            },

            /**
             * Get log statistics for this entity
             * @returns {Object} - Log statistics
             */
            get stats() {
                return logger.getEntityLogStats(entityType, parent.name);
            },

            /**
             * Get recent logs for this entity
             * @param {number} [count=5] - Number of recent logs to retrieve
             * @returns {Array} - Array of recent log entries
             */
            recent: (count = 5) => {
                return logger.getEntityLogs(entityType, parent.name, { limit: count });
            },

            /**
             * Get logs by level for this entity
             * @param {string} level - Log level (error, warn, info, debug)
             * @param {number} [count] - Limit number of results
             * @returns {Array} - Array of filtered log entries
             */
            byLevel: (level, count) => {
                const filters = { level };
                if (count) filters.limit = count;
                return logger.getEntityLogs(entityType, parent.name, filters);
            },

            /**
             * Get logs since a specific date for this entity
             * @param {Date} since - Date to filter from
             * @param {number} [count] - Limit number of results
             * @returns {Array} - Array of filtered log entries
             */
            since: (since, count) => {
                const filters = { since };
                if (count) filters.limit = count;
                return logger.getEntityLogs(entityType, parent.name, filters);
            },

            /**
             * Clear all logs for this entity
             */
            clear: () => {
                logger.clearEntityLog(entityType, parent.name);
            },

            /**
             * Get formatted log summary for dashboard display
             * @param {number} [count=5] - Number of recent logs to include
             * @returns {Object} - Formatted log summary
             */
            summary: (count = 5) => {
                const recent = logger.getEntityLogs(entityType, parent.name, { limit: count });
                const stats = logger.getEntityLogStats(entityType, parent.name);
                
                return {
                    recentLogs: recent.map(log => ({
                        timestamp: log.timestamp,
                        level: log.level,
                        message: log.message,
                        metadata: log.metadata || {},
                        timeAgo: getTimeAgo(new Date(log.timestamp))
                    })),
                    stats: stats,
                    hasErrors: stats.byLevel.error > 0,
                    hasWarnings: stats.byLevel.warn > 0
                };
            }
        }
    };
};

/**
 * Helper function to get human-readable time difference
 * @param {Date} date - Date to compare
 * @returns {string} - Human-readable time difference
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return `${diffSec}s ago`;
    } else if (diffMin < 60) {
        return `${diffMin}m ago`;
    } else if (diffHour < 24) {
        return `${diffHour}h ago`;
    } else {
        return `${diffDay}d ago`;
    }
}

module.exports = LoggingMixin;
