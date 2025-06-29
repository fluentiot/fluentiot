const logger = require('./../../logger')

/**
 * Event broadcaster for broadcasting logs and device activity to connected clients
 *
 * @class
 */
class EventBroadcaster {

    /**
     * Constructor
     * 
     * @param {Server} io - Socket.IO server instance
     * @param {Object} eventComponent - Event component from FluentIot
     */
    constructor(io, eventComponent) {
        this.io = io;
        this.eventComponent = eventComponent;
        this.originalLoggerMethods = {};
        this.isSetup = false;
    }

    /**
     * Setup event broadcasting
     */
    setup() {
        if (this.isSetup) {
            return;
        }

        this.setupLoggerInterception();
        this.setupEventListeners();
        this.isSetup = true;
        
        logger.info('Event broadcaster setup completed', 'socketio-events');
    }

    /**
     * Setup logger interception to broadcast logs
     */
    setupLoggerInterception() {
        try {
            // Get the logger instance
            const loggerInstance = logger;
            
            // Store original methods
            this.originalLoggerMethods = {
                error: loggerInstance.error.bind(loggerInstance),
                warn: loggerInstance.warn.bind(loggerInstance),
                info: loggerInstance.info.bind(loggerInstance),
                debug: loggerInstance.debug.bind(loggerInstance),
                verbose: loggerInstance.verbose.bind(loggerInstance)
            };

            // Override logger methods to broadcast logs
            const self = this;
            
            loggerInstance.error = function(message, component) {
                self.originalLoggerMethods.error(message, component);
                self.broadcastLog('error', message, component);
            };

            loggerInstance.warn = function(message, component) {
                self.originalLoggerMethods.warn(message, component);
                self.broadcastLog('warn', message, component);
            };

            loggerInstance.info = function(message, component) {
                self.originalLoggerMethods.info(message, component);
                self.broadcastLog('info', message, component);
            };

            loggerInstance.debug = function(message, component) {
                self.originalLoggerMethods.debug(message, component);
                self.broadcastLog('debug', message, component);
            };

            loggerInstance.verbose = function(message, component) {
                self.originalLoggerMethods.verbose(message, component);
                self.broadcastLog('verbose', message, component);
            };

            logger.info('Logger interception setup completed', 'socketio-events');
            
        } catch (error) {
            logger.error(`Failed to setup logger interception: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Setup event listeners for device activity and other events
     */
    setupEventListeners() {
        try {
            if (this.eventComponent) {
                // Listen for device events
                this.eventComponent.on('device.*', (data) => {
                    this.broadcastDeviceEvent(data);
                });

                // Listen for scenario events
                this.eventComponent.on('scenario.*', (data) => {
                    this.broadcastScenarioEvent(data);
                });

                // Listen for scene events
                this.eventComponent.on('scene.*', (data) => {
                    this.broadcastSceneEvent(data);
                });

                // Listen for system events
                this.eventComponent.on('system.*', (data) => {
                    this.broadcastSystemEvent(data);
                });

                logger.info('Event listeners setup completed', 'socketio-events');
            } else {
                logger.warn('Event component not available, skipping event listeners setup', 'socketio-events');
            }
        } catch (error) {
            logger.error(`Failed to setup event listeners: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast log message to all connected clients
     * 
     * @param {String} level - Log level (error, warn, info, debug, verbose)
     * @param {String} message - Log message
     * @param {String} component - Component name
     */
    broadcastLog(level, message, component) {
        try {
            const logData = {
                level: level,
                message: message,
                component: component || 'unknown',
                timestamp: new Date().toISOString(),
                type: 'log'
            };

            this.io.emit('log', logData);
        } catch (error) {
            // Use original logger method to avoid recursion
            this.originalLoggerMethods.error(`Failed to broadcast log: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast device event to all connected clients
     * 
     * @param {Object} data - Device event data
     */
    broadcastDeviceEvent(data) {
        try {
            const deviceEvent = {
                type: 'device_activity',
                data: data,
                timestamp: new Date().toISOString()
            };

            this.io.emit('device_activity', deviceEvent);
            
            // Also emit to general activity feed
            this.io.emit('activity', {
                category: 'device',
                ...deviceEvent
            });
        } catch (error) {
            logger.error(`Failed to broadcast device event: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast scenario event to all connected clients
     * 
     * @param {Object} data - Scenario event data
     */
    broadcastScenarioEvent(data) {
        try {
            const scenarioEvent = {
                type: 'scenario_activity',
                data: data,
                timestamp: new Date().toISOString()
            };

            this.io.emit('scenario_activity', scenarioEvent);
            
            // Also emit to general activity feed
            this.io.emit('activity', {
                category: 'scenario',
                ...scenarioEvent
            });
        } catch (error) {
            logger.error(`Failed to broadcast scenario event: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast scene event to all connected clients
     * 
     * @param {Object} data - Scene event data
     */
    broadcastSceneEvent(data) {
        try {
            const sceneEvent = {
                type: 'scene_activity',
                data: data,
                timestamp: new Date().toISOString()
            };

            this.io.emit('scene_activity', sceneEvent);
            
            // Also emit to general activity feed
            this.io.emit('activity', {
                category: 'scene',
                ...sceneEvent
            });
        } catch (error) {
            logger.error(`Failed to broadcast scene event: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast system event to all connected clients
     * 
     * @param {Object} data - System event data
     */
    broadcastSystemEvent(data) {
        try {
            const systemEvent = {
                type: 'system_activity',
                data: data,
                timestamp: new Date().toISOString()
            };

            this.io.emit('system_activity', systemEvent);
            
            // Also emit to general activity feed
            this.io.emit('activity', {
                category: 'system',
                ...systemEvent
            });
        } catch (error) {
            logger.error(`Failed to broadcast system event: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Broadcast custom event to all connected clients
     * 
     * @param {String} eventName - Event name
     * @param {Object} data - Event data
     */
    broadcastCustomEvent(eventName, data) {
        try {
            const customEvent = {
                type: 'custom_event',
                eventName: eventName,
                data: data,
                timestamp: new Date().toISOString()
            };

            this.io.emit(eventName, customEvent);
            
            // Also emit to general activity feed
            this.io.emit('activity', {
                category: 'custom',
                ...customEvent
            });
        } catch (error) {
            logger.error(`Failed to broadcast custom event: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Send heartbeat to all connected clients
     */
    sendHeartbeat() {
        try {
            const heartbeat = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };

            this.io.emit('heartbeat', heartbeat);
        } catch (error) {
            logger.error(`Failed to send heartbeat: ${error.message}`, 'socketio-events');
        }
    }

    /**
     * Start heartbeat interval
     */
    startHeartbeat(intervalMs = 30000) {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, intervalMs);

        logger.info(`Heartbeat started with ${intervalMs}ms interval`, 'socketio-events');
    }

    /**
     * Stop heartbeat interval
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            logger.info('Heartbeat stopped', 'socketio-events');
        }
    }

    /**
     * Restore original logger methods and clean up
     */
    teardown() {
        try {
            // Restore original logger methods
            if (this.originalLoggerMethods && Object.keys(this.originalLoggerMethods).length > 0) {
                const loggerInstance = logger;
                loggerInstance.error = this.originalLoggerMethods.error;
                loggerInstance.warn = this.originalLoggerMethods.warn;
                loggerInstance.info = this.originalLoggerMethods.info;
                loggerInstance.debug = this.originalLoggerMethods.debug;
                loggerInstance.verbose = this.originalLoggerMethods.verbose;
            }

            // Stop heartbeat
            this.stopHeartbeat();

            this.isSetup = false;
            logger.info('Event broadcaster teardown completed', 'socketio-events');
        } catch (error) {
            logger.error(`Failed to teardown event broadcaster: ${error.message}`, 'socketio-events');
        }
    }
}

module.exports = EventBroadcaster;
