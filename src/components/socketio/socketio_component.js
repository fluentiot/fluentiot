const Component = require('./../component')
const logger = require('./../../logger')
const config = require('./../../config');
const { Server } = require('socket.io');
const http = require('http');

const SocketServer = require('./socket_server');
const CommandHandler = require('./command_handler');
const EventBroadcaster = require('./event_broadcaster');

/**
 * SocketIO component for real-time communication
 *
 * @extends Component
 * @class
 */
class SocketIOComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        
        this.config = config.get('socketio') || {};
        this.server = null;
        this.io = null;
        this.socketServer = null;
        this.commandHandler = null;
        this.eventBroadcaster = null;
        
        // Check if component is enabled
        if (!this.config.enabled) {
            logger.info('SocketIO component is disabled', 'socketio');
            return;
        }
        
        logger.info('SocketIO component initialized', 'socketio');
    }

    /**
     * Start the SocketIO server
     */
    start() {
        logger.info('SocketIO start() method called', 'socketio');
        logger.info(`SocketIO config enabled: ${this.config.enabled}`, 'socketio');
        
        if (!this.config.enabled) {
            logger.warn('SocketIO component is disabled, not starting server', 'socketio');
            return;
        }

        try {
            logger.info('Creating SocketIO server...', 'socketio');
            
            // Create HTTP server
            this.server = http.createServer();
            
            // Create Socket.IO server
            this.io = new Server(this.server, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"],
                    allowedHeaders: ["*"],
                    credentials: true
                },
                allowEIO3: true,
                transports: ['polling', 'websocket']
            });

            // Initialize sub-components
            this.socketServer = new SocketServer(this.io, this.config);
            this.commandHandler = new CommandHandler(this.Fluent);
            this.eventBroadcaster = new EventBroadcaster(this.io, this.event());

            // Setup socket server with command handler
            this.socketServer.setup(this.commandHandler);
            
            // Setup event broadcasting
            this.eventBroadcaster.setup();

            // Start listening
            const port = this.config.port || 9002;
            const host = this.config.host || 'localhost';
            
            logger.info(`Attempting to bind SocketIO server to ${host}:${port}`, 'socketio');
            
            this.server.listen(port, host, () => {
                logger.info(`SocketIO server listening on ${host}:${port}`, 'socketio');
            });

            this.server.on('error', (err) => {
                logger.error(`SocketIO server error: ${err.message}`, 'socketio');
            });

        } catch (error) {
            logger.error(`Failed to start SocketIO server: ${error.message}`, 'socketio');
            logger.error(`Stack trace: ${error.stack}`, 'socketio');
        }
    }

    /**
     * Stop the SocketIO server
     */
    stop() {
        if (this.server) {
            this.server.close();
            logger.info('SocketIO server stopped', 'socketio');
        }
        
        if (this.eventBroadcaster) {
            this.eventBroadcaster.teardown();
        }
    }

    /**
     * Get the Socket.IO instance
     */
    getIO() {
        return this.io;
    }

    /**
     * Broadcast a message to all connected clients
     */
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    /**
     * Teardown the component
     */
    teardown() {
        this.stop();
        super.teardown();
    }
}

module.exports = SocketIOComponent;
