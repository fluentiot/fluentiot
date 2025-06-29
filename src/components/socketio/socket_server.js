const logger = require('./../../logger')

/**
 * Socket server handler for managing client connections and authentication
 *
 * @class
 */
class SocketServer {

    /**
     * Constructor
     * 
     * @param {Server} io - Socket.IO server instance
     * @param {Object} config - SocketIO configuration
     */
    constructor(io, config) {
        this.io = io;
        this.config = config;
        this.commandHandler = null;
        this.connectedClients = new Map();
    }

    /**
     * Setup socket server with command handler
     * 
     * @param {CommandHandler} commandHandler - Command handler instance
     */
    setup(commandHandler) {
        this.commandHandler = commandHandler;
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    /**
     * Setup authentication middleware
     */
    setupMiddleware() {
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            const expectedToken = this.config.auth?.token;

            if (!expectedToken) {
                // No auth required
                return next();
            }

            if (token === expectedToken) {
                logger.info(`Client authenticated: ${socket.id}`, 'socketio');
                return next();
            } else {
                logger.warn(`Authentication failed for client: ${socket.id}`, 'socketio');
                return next(new Error('Authentication failed'));
            }
        });
    }

    /**
     * Setup event handlers for socket connections
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    /**
     * Handle new client connection
     * 
     * @param {Socket} socket - Client socket
     */
    handleConnection(socket) {
        const clientInfo = {
            id: socket.id,
            connectedAt: new Date(),
            address: socket.handshake.address
        };

        this.connectedClients.set(socket.id, clientInfo);
        
        logger.info(`Client connected: ${socket.id} from ${clientInfo.address}`, 'socketio');
        
        // Send welcome message with system info
        socket.emit('welcome', {
            message: 'Connected to HomeIot System',
            clientId: socket.id,
            serverTime: new Date(),
            features: ['device_status', 'logs', 'commands', 'scenarios', 'rooms']
        });

        // Setup event handlers for this socket
        this.setupSocketEventHandlers(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
    }

    /**
     * Setup event handlers for individual socket
     * 
     * @param {Socket} socket - Client socket
     */
    setupSocketEventHandlers(socket) {
        // Command execution
        socket.on('execute_command', (data) => {
            this.handleCommand(socket, data);
        });

        // Generic command handler for CLI-style commands
        socket.on('command', (data) => {
            this.handleGenericCommand(socket, data);
        });

        // Get system info
        socket.on('get_devices', () => {
            this.sendDevices(socket);
        });

        socket.on('get_rooms', () => {
            this.sendRooms(socket);
        });

        socket.on('get_scenarios', () => {
            this.sendScenarios(socket);
        });

        socket.on('get_system_status', () => {
            this.sendSystemStatus(socket);
        });

        // Free text input (placeholder for future AI processing)
        socket.on('free_text_input', (data) => {
            this.handleFreeTextInput(socket, data);
        });

        // Client heartbeat
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // Get command suggestions
        socket.on('get_command_suggestions', () => {
            this.sendCommandSuggestions(socket);
        });
    }

    /**
     * Handle command execution
     * 
     * @param {Socket} socket - Client socket
     * @param {Object} data - Command data
     */
    handleCommand(socket, data) {
        try {
            logger.info(`Command received from ${socket.id}: ${JSON.stringify(data)}`, 'socketio');
            
            if (this.commandHandler) {
                this.commandHandler.execute(data, (result) => {
                    socket.emit('command_result', {
                        commandId: data.id,
                        success: true,
                        result: result,
                        timestamp: new Date()
                    });
                });
            } else {
                socket.emit('command_result', {
                    commandId: data.id,
                    success: false,
                    error: 'Command handler not available',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            logger.error(`Command execution error: ${error.message}`, 'socketio');
            socket.emit('command_result', {
                commandId: data.id,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    /**
     * Send devices list to client
     * 
     * @param {Socket} socket - Client socket
     */
    sendDevices(socket) {
        try {
            // This would get devices from the device component
            // For now, send a placeholder response
            socket.emit('devices_list', {
                devices: [],
                timestamp: new Date(),
                message: 'Device integration pending'
            });
        } catch (error) {
            logger.error(`Error sending devices: ${error.message}`, 'socketio');
        }
    }

    /**
     * Send rooms list to client
     * 
     * @param {Socket} socket - Client socket
     */
    sendRooms(socket) {
        try {
            socket.emit('rooms_list', {
                rooms: [],
                timestamp: new Date(),
                message: 'Room integration pending'
            });
        } catch (error) {
            logger.error(`Error sending rooms: ${error.message}`, 'socketio');
        }
    }

    /**
     * Send scenarios list to client
     * 
     * @param {Socket} socket - Client socket
     */
    sendScenarios(socket) {
        try {
            socket.emit('scenarios_list', {
                scenarios: [],
                timestamp: new Date(),
                message: 'Scenario integration pending'
            });
        } catch (error) {
            logger.error(`Error sending scenarios: ${error.message}`, 'socketio');
        }
    }

    /**
     * Send system status to client
     * 
     * @param {Socket} socket - Client socket
     */
    sendSystemStatus(socket) {
        try {
            const status = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                connectedClients: this.connectedClients.size,
                timestamp: new Date()
            };
            
            socket.emit('system_status', status);
        } catch (error) {
            logger.error(`Error sending system status: ${error.message}`, 'socketio');
        }
    }

    /**
     * Handle free text input (placeholder for future AI processing)
     * 
     * @param {Socket} socket - Client socket
     * @param {Object} data - Text input data
     */
    handleFreeTextInput(socket, data) {
        logger.info(`Free text input from ${socket.id}: ${data.text}`, 'socketio');
        
        // Placeholder response - future AI processing will go here
        socket.emit('free_text_response', {
            originalText: data.text,
            response: 'Free text processing will be implemented with AI in the future',
            timestamp: new Date(),
            processed: false
        });
    }

    /**
     * Handle client disconnection
     * 
     * @param {Socket} socket - Client socket
     * @param {String} reason - Disconnect reason
     */
    handleDisconnection(socket, reason) {
        this.connectedClients.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`, 'socketio');
    }

    /**
     * Get connected clients count
     */
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    /**
     * Get connected clients info
     */
    getConnectedClients() {
        return Array.from(this.connectedClients.values());
    }

    /**
     * Handle generic command execution (CLI-style commands)
     * 
     * @param {Socket} socket - Client socket
     * @param {Object} data - Command data with command string
     */
    handleGenericCommand(socket, data) {
        try {
            const command = data.command ? data.command.trim() : '';
            logger.info(`Generic command received from ${socket.id}: ${command}`, 'socketio');
            
            if (!command) {
                socket.emit('command_response', {
                    success: false,
                    message: 'Empty command'
                });
                return;
            }

            // Parse and execute the command
            const result = this.parseAndExecuteCommand(command);
            
            // Handle promises
            if (result instanceof Promise) {
                result
                    .then(res => {
                        socket.emit('command_response', {
                            success: true,
                            message: res
                        });
                    })
                    .catch(err => {
                        socket.emit('command_response', {
                            success: false,
                            message: `Error: ${err.message}`
                        });
                    });
            } else {
                socket.emit('command_response', {
                    success: true,
                    message: result
                });
            }
            
        } catch (error) {
            logger.error(`Generic command execution error: ${error.message}`, 'socketio');
            socket.emit('command_response', {
                success: false,
                message: `Command failed: ${error.message}`
            });
        }
    }

    /**
     * Parse and execute a CLI-style command
     * 
     * @param {String} command - The command string to parse and execute
     * @returns {String|Promise} - Command result
     */
    parseAndExecuteCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase(); // Only lowercase the command, not the arguments
        const args = parts.slice(1); // Keep original case for arguments

        switch (cmd) {
            case 'help':
                return this.getCommandHelp();
            
            case 'devices':
                return this.executeDevicesList();
            
            case 'rooms':
                return this.executeRoomsList();
            
            case 'scenarios':
                return this.executeScenariosList();
            
            case 'scenes':
                return this.executeScenesList();
            
            case 'activate':
                if (args.length >= 2 && args[0] === 'scene') {
                    const sceneName = args.slice(1).join(' ');
                    return this.executeSceneActivate(sceneName);
                }
                return 'Usage: activate scene [scene name]';
            
            case 'status':
                return this.executeSystemStatus();
            
            case 'clear':
                return 'Activity log cleared';
            
            case 'turn':
                if (args.length >= 2) {
                    const action = args[0]; // 'on' or 'off'
                    const deviceName = args.slice(1).join(' ');
                    return this.executeDeviceControl(deviceName, action);
                }
                return 'Usage: turn [on|off] [device name]';
            
            case 'execute':
                if (args.length >= 3) {
                    const capabilityName = args[0];
                    if (args[1].toLowerCase() === 'on' && args[2]) {
                        const deviceName = args.slice(2).join(' ');
                        return this.executeDeviceCapability(deviceName, capabilityName);
                    }
                }
                return 'Usage: execute [capability] on [device name]';
            
            case 'device':
                if (args.length >= 2) {
                    const deviceName = args[0];
                    const capabilityName = args[1];
                    return this.executeDeviceCapability(deviceName, capabilityName);
                }
                return 'Usage: device [device name] [capability]';
            
            case 'trigger':
                if (args.length >= 1) {
                    const scenarioName = args.join(' ');
                    return this.executeScenarioTrigger(scenarioName);
                }
                return 'Usage: trigger [scenario name]';
            
            case 'inspect':
                if (args.length >= 2) {
                    const type = args[0]; // 'device' or 'room'
                    const name = args.slice(1).join(' ');
                    if (type === 'device') {
                        return this.executeDeviceInspect(name);
                    } else if (type === 'room') {
                        return this.executeRoomInspect(name);
                    }
                }
                return 'Usage: inspect [device|room] [name]';
            
            case 'set':
                if (args.length >= 3 && args[0] === 'variable') {
                    const varName = args[1];
                    const value = args.slice(2).join(' ');
                    return this.executeSetVariable(varName, value);
                }
                return 'Usage: set variable [name] [value]';
            
            case 'get':
                if (args.length >= 2 && args[0] === 'variable') {
                    const varName = args[1];
                    return this.executeGetVariable(varName);
                }
                return 'Usage: get variable [name]';
            
            case 'logs':
                return this.executeGetLogs();
            
            case 'restart':
                if (args.length >= 2 && args[0] === 'component') {
                    const componentName = args[1];
                    return this.executeRestartComponent(componentName);
                }
                return 'Usage: restart component [name]';
            
            // Media commands
            case 'play':
                if (args.length >= 1) {
                    const soundName = args.join(' ');
                    return this.executePlaySound(soundName);
                }
                return 'Usage: play [sound name]';
            
            case 'say':
                if (args.length >= 1) {
                    const text = args.join(' ');
                    return this.executeSayText(text);
                }
                return 'Usage: say [text to speak]';
            
            case 'sounds':
                return this.executeListSounds();
            
            case 'voices':
                return this.executeListVoices();
            
            case 'stop':
                if (args.length >= 1 && args[0] === 'speech') {
                    return this.executeStopSpeech();
                }
                return 'Usage: stop speech';
            
            case 'speech':
                if (args.length >= 1 && args[0] === 'status') {
                    return this.executeSpeechStatus();
                }
                return 'Usage: speech status';
            
            case 'eval':
            case 'js':
                // WARNING: This is potentially dangerous in production
                // Only enable in development/test environments
                if (this.config.allowEval === true) {
                    const code = args.join(' ');
                    return this.executeEval(code);
                }
                return 'Eval command is disabled for security reasons';
            
            default:
                return `Unknown command: ${cmd}. Type 'help' for available commands.`;
        }
    }

    // Command execution helpers
    getCommandHelp() {
        return `Available commands:
• help - Show this help message
• scenes - List all scenes
• devices - List all devices
• rooms - List all rooms
• scenarios - List all scenarios
• status - Show system status
• logs - Show recent system logs
• clear - Clear activity log
• turn [on|off] [device] - Control a device (legacy)
• execute [capability] on [device] - Execute a specific device capability
• device [device] [capability] - Execute a capability on a device
• trigger [scenario] - Run a scenario
• activate scene [name] - Activate a scene
• inspect device [name] - Get device details
• inspect room [name] - Get room details
• set variable [name] [value] - Set a variable
• get variable [name] - Get a variable value
• restart component [name] - Restart a component

Media Commands:
• play [sound name] - Play a sound file
• say [text] - Convert text to speech
• sounds - List available sound files
• voices - List available voices
• stop speech - Stop current speech
• speech status - Get speech status`;
    }

    executeDevicesList() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'device.list' }, (result) => {
                    if (result.success && result.data) {
                        const devices = Object.keys(result.data);
                        if (devices.length === 0) {
                            resolve('No devices found');
                        } else {
                            resolve(`Devices (${devices.length}):\n${devices.map(d => `• ${d}`).join('\n')}`);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list devices'));
                    }
                });
            });
        }
        return 'Device component not available';
    }

    executeRoomsList() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'room.list' }, (result) => {
                    if (result.success && result.data) {
                        const rooms = Object.keys(result.data);
                        if (rooms.length === 0) {
                            resolve('No rooms found');
                        } else {
                            resolve(`Rooms (${rooms.length}):\n${rooms.map(r => `• ${r}`).join('\n')}`);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list rooms'));
                    }
                });
            });
        }
        return 'Room component not available';
    }

    executeScenariosList() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'scenario.list' }, (result) => {
                    if (result.success && result.data) {
                        const scenarios = result.data;
                        if (scenarios.length === 0) {
                            resolve('No scenarios found');
                        } else {
                            resolve(`Scenarios (${scenarios.length}):\n${scenarios.map(s => `• ${s.name || s}`).join('\n')}`);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list scenarios'));
                    }
                });
            });
        }
        return 'Scenario component not available';
    }

    executeScenesList() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'scene.list' }, (result) => {
                    if (result.success && result.data) {
                        const scenes = result.data;
                        if (typeof scenes === 'object' && Object.keys(scenes).length === 0) {
                            resolve('No scenes found');
                        } else if (typeof scenes === 'object') {
                            const sceneNames = Object.keys(scenes);
                            resolve(`Scenes (${sceneNames.length}):\n${sceneNames.map(s => `• ${s}`).join('\n')}`);
                        } else {
                            resolve('No scenes available');
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list scenes'));
                    }
                });
            });
        }
        return 'Scene component not available';
    }

    executeSceneActivate(sceneName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'scene.activate', parameters: { sceneName: sceneName } }, (result) => {
                    if (result.success) {
                        resolve(`Scene '${sceneName}' activated`);
                    } else {
                        reject(new Error(result.error || `Failed to activate scene '${sceneName}'`));
                    }
                });
            });
        }
        return `Scene activation not available`;
    }

    executeSystemStatus() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'system.status' }, (result) => {
                    if (result.success && result.data) {
                        const status = result.data;
                        resolve(`System Status:
• Connected clients: ${this.connectedClients.size}
• Uptime: ${status.uptime || 'Unknown'}
• Memory usage: ${status.memory || 'Unknown'}
• Components: ${status.components || 'Unknown'}`);
                    } else {
                        reject(new Error(result.error || 'Failed to get status'));
                    }
                });
            });
        }
        return `System Status:
• Connected clients: ${this.connectedClients.size}
• Server time: ${new Date().toLocaleString()}
• Command handler: ${this.commandHandler ? 'Available' : 'Not available'}`;
    }

    executeDeviceControl(deviceName, action) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                const params = {
                    deviceId: deviceName,
                    action: action,
                    value: action === 'on' ? true : false
                };
                
                this.commandHandler.execute({ command: 'device.control', parameters: params }, (result) => {
                    if (result.success) {
                        resolve(`${deviceName} turned ${action}`);
                    } else {
                        reject(new Error(result.error || `Failed to turn ${action} ${deviceName}`));
                    }
                });
            });
        }
        return `Device control not available`;
    }

    executeDeviceCapability(deviceName, capabilityName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                const params = {
                    deviceId: deviceName,
                    capabilityName: capabilityName
                };
                
                this.commandHandler.execute({ command: 'device.capability', parameters: params }, (result) => {
                    if (result.success && result.data) {
                        resolve(`Executed ${capabilityName} on ${deviceName}`);
                    } else {
                        reject(new Error(result.error || `Failed to execute ${capabilityName} on ${deviceName}`));
                    }
                });
            });
        }
        return `Device capability execution not available`;
    }

    executeScenarioTrigger(scenarioName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'scenario.run', parameters: { scenario: scenarioName } }, (result) => {
                    if (result.success) {
                        resolve(`Scenario '${scenarioName}' triggered`);
                    } else {
                        reject(new Error(result.error || `Failed to trigger scenario '${scenarioName}'`));
                    }
                });
            });
        }
        return `Scenario execution not available`;
    }

    executeDeviceInspect(deviceName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'device.get', parameters: { deviceId: deviceName } }, (result) => {
                    if (result.success && result.data) {
                        const device = result.data;
                        resolve(`Device: ${deviceName}
• Type: ${device.type || 'Unknown'}
• Status: ${device.attributes?.switch !== undefined ? (device.attributes.switch ? 'ON' : 'OFF') : 'Unknown'}
• Attributes: ${JSON.stringify(device.attributes || {}, null, 2)}`);
                    } else {
                        reject(new Error(result.error || `Device '${deviceName}' not found`));
                    }
                });
            });
        }
        return `Device inspection not available`;
    }

    executeRoomInspect(roomName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'room.get', parameters: { roomId: roomName } }, (result) => {
                    if (result.success && result.data) {
                        const room = result.data;
                        const devices = room.devices ? Object.keys(room.devices) : [];
                        resolve(`Room: ${roomName}
• Devices (${devices.length}): ${devices.join(', ') || 'None'}
• Description: ${room.description || 'No description'}
• Configuration: ${JSON.stringify(room.config || {}, null, 2)}`);
                    } else {
                        reject(new Error(result.error || `Room '${roomName}' not found`));
                    }
                });
            });
        }
        return `Room inspection not available`;
    }

    executeSetVariable(name, value) {
        // This would integrate with a variable component if available
        return `Variable '${name}' set to '${value}' (feature pending)`;
    }

    executeGetVariable(name) {
        // This would integrate with a variable component if available
        return `Variable '${name}' value: (feature pending)`;
    }

    executeGetLogs() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'system.logs' }, (result) => {
                    if (result.success && result.data) {
                        const logs = result.data;
                        if (Array.isArray(logs) && logs.length > 0) {
                            const recentLogs = logs.slice(-10); // Last 10 logs
                            resolve(`Recent logs:\n${recentLogs.map(log => `${log.timestamp || new Date().toLocaleTimeString()} [${log.level || 'info'}] ${log.message}`).join('\n')}`);
                        } else {
                            resolve('No recent logs available');
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to get logs'));
                    }
                });
            });
        }
        return 'Logging system not available';
    }

    executeRestartComponent(componentName) {
        // This would integrate with component management if available
        return `Component '${componentName}' restart requested (feature pending)`;
    }

    executeEval(code) {
        try {
            // WARNING: This is extremely dangerous and should only be used in development
            // In production, this should be completely disabled or heavily sandboxed
            const result = eval(code);
            return `Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
        } catch (error) {
            return `Eval error: ${error.message}`;
        }
    }

    // Media command execution helpers
    executePlaySound(soundName) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.play', parameters: { soundName: soundName } }, (result) => {
                    if (result.success) {
                        resolve(`Playing sound: ${soundName}`);
                    } else {
                        reject(new Error(result.error || `Failed to play sound '${soundName}'`));
                    }
                });
            });
        }
        return 'Audio component not available';
    }

    executeSayText(text) {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.say', parameters: { text: text } }, (result) => {
                    if (result.success) {
                        resolve(`Speaking: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                    } else {
                        reject(new Error(result.error || `Failed to speak text`));
                    }
                });
            });
        }
        return 'Speech component not available';
    }

    executeListSounds() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.sounds' }, (result) => {
                    if (result.success && result.data && result.data.sounds) {
                        const sounds = result.data.sounds;
                        if (sounds.length === 0) {
                            resolve('No sound files found');
                        } else {
                            resolve(`Available sounds (${sounds.length}):\n${sounds.map(s => `• ${s}`).join('\n')}`);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list sounds'));
                    }
                });
            });
        }
        return 'Audio component not available';
    }

    executeListVoices() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.voices' }, (result) => {
                    if (result.success && result.data && result.data.voices) {
                        const voices = result.data.voices;
                        if (voices.length === 0) {
                            resolve('No voices available or voice listing not supported on this platform');
                        } else {
                            resolve(`Available voices (${voices.length}):\n${voices.map(v => `• ${v}`).join('\n')}`);
                        }
                    } else {
                        reject(new Error(result.error || 'Failed to list voices'));
                    }
                });
            });
        }
        return 'Speech component not available';
    }

    executeStopSpeech() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.speech.stop' }, (result) => {
                    if (result.success) {
                        resolve('Speech stopped and queue cleared');
                    } else {
                        reject(new Error(result.error || 'Failed to stop speech'));
                    }
                });
            });
        }
        return 'Speech component not available';
    }

    executeSpeechStatus() {
        if (this.commandHandler) {
            return new Promise((resolve, reject) => {
                this.commandHandler.execute({ command: 'media.speech.status' }, (result) => {
                    if (result.success && result.data && result.data.status) {
                        const status = result.data.status;
                        resolve(`Speech Status:
• Currently speaking: ${status.speaking ? 'Yes' : 'No'}
• Queue length: ${status.queueLength} items`);
                    } else {
                        reject(new Error(result.error || 'Failed to get speech status'));
                    }
                });
            });
        }
        return 'Speech component not available';
    }

    /**
     * Send command suggestions to client
     * 
     * @param {Socket} socket - Client socket
     */
    sendCommandSuggestions(socket) {
        try {
            const commandInfo = this.commandHandler.getAvailableCommands();
            socket.emit('command_suggestions', {
                commands: commandInfo.commands,
                suggestions: commandInfo.suggestions,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error(`Error sending command suggestions: ${error.message}`, 'socketio');
        }
    }
}

module.exports = SocketServer;
