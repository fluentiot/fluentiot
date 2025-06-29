const logger = require('./../../logger')

/**
 * Command handler for processing commands received via SocketIO
 *
 * @class
 */
class CommandHandler {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework instance
     */
    constructor(Fluent) {
        this.Fluent = Fluent;
        this.availableCommands = this.initializeCommands();
    }

    /**
     * Initialize available commands
     */
    initializeCommands() {
        return {
            // Device commands
            'device.list': this.listDevices.bind(this),
            'device.get': this.getDevice.bind(this),
            'device.control': this.controlDevice.bind(this),
            
            // Room commands
            'room.list': this.listRooms.bind(this),
            'room.get': this.getRoom.bind(this),
            
            // Scenario commands
            'scenario.list': this.listScenarios.bind(this),
            'scenario.get': this.getScenario.bind(this),
            'scenario.run': this.runScenario.bind(this),
            'scenario.stop': this.stopScenario.bind(this),
            
            // Scene commands
            'scene.list': this.listScenes.bind(this),
            'scene.activate': this.activateScene.bind(this),
            
            // System commands
            'system.status': this.getSystemStatus.bind(this),
            'system.logs': this.getSystemLogs.bind(this),
            
            // Sound commands
            'sound.play': this.playSound.bind(this),
            'sound.say': this.sayText.bind(this),
            
            // Assistant commands
            'assistant.broadcast': this.assistantBroadcast.bind(this)
        };
    }

    /**
     * Execute a command
     * 
     * @param {Object} commandData - Command data containing type, parameters, etc.
     * @param {Function} callback - Callback function to handle the result
     */
    execute(commandData, callback) {
        try {
            const { command, parameters = {}, id } = commandData;
            
            logger.info(`Executing command: ${command}`, 'socketio-cmd');
            
            if (!this.availableCommands[command]) {
                callback({
                    success: false,
                    error: `Unknown command: ${command}`,
                    availableCommands: Object.keys(this.availableCommands)
                });
                return;
            }

            // Execute the command
            const result = this.availableCommands[command](parameters);
            
            // Handle promises
            if (result instanceof Promise) {
                result
                    .then(res => callback({ success: true, data: res }))
                    .catch(err => callback({ success: false, error: err.message }));
            } else {
                callback({ success: true, data: result });
            }
            
        } catch (error) {
            logger.error(`Command execution error: ${error.message}`, 'socketio-cmd');
            callback({ success: false, error: error.message });
        }
    }

    // Device Commands
    listDevices(params) {
        try {
            const deviceComponent = this.Fluent._component().get('device');
            if (deviceComponent) {
                const devices = deviceComponent.devices || {};
                const deviceCount = Object.keys(devices).length;
                logger.info(`Device component found, devices count: ${deviceCount}`, 'socketio-cmd');
                
                // Create a safe, serializable version of the devices
                const safeDevices = {};
                Object.keys(devices).forEach(deviceName => {
                    const device = devices[deviceName];
                    safeDevices[deviceName] = {
                        name: device.name || deviceName,
                        attributes: device.attributes || {},
                        capabilities: Array.isArray(device.capabilities) ? device.capabilities : [],
                        // Add other safe properties as needed, but avoid circular references
                        type: device.type || 'unknown'
                    };
                });
                
                logger.info(`Returning ${Object.keys(safeDevices).length} safe devices`, 'socketio-cmd');
                return safeDevices;
            }
            logger.warn('Device component not available', 'socketio-cmd');
            return {};
        } catch (error) {
            logger.error(`Error listing devices: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    getDevice(params) {
        try {
            const { deviceId, action } = params;
            const deviceComponent = this.Fluent._component().get('device');
            if (deviceComponent && deviceComponent.get) {
                const device = deviceComponent.get(deviceId);
                if (!device) {
                    return { error: `Device "${deviceId}" not found` };
                }
                
                // If action is 'describe', use the describe method
                if (action === 'describe' && typeof device.describe === 'function') {
                    return device.describe();
                }
                
                // Return basic device info without circular references
                return {
                    name: device.name || deviceId,
                    attributes: device.attributes || {},
                    capabilities: Object.keys(device.capabilities || {}),
                    type: 'device'
                };
            }
            return { message: 'Device component not available' };
        } catch (error) {
            logger.error(`Error getting device: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    controlDevice(params) {
        try {
            const { deviceId, action, value } = params;
            const deviceComponent = this.Fluent._component().get('device');
            if (deviceComponent && deviceComponent.control) {
                return deviceComponent.control(deviceId, action, value);
            }
            return { message: 'Device control not available' };
        } catch (error) {
            logger.error(`Error controlling device: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // Room Commands
    listRooms(params) {
        try {
            const roomComponent = this.Fluent._component().get('room');
            if (roomComponent) {
                const rooms = roomComponent.rooms || {};
                const roomCount = Object.keys(rooms).length;
                logger.info(`Room component found, rooms count: ${roomCount}`, 'socketio-cmd');
                
                // Create a safe, serializable version of the rooms
                const safeRooms = {};
                Object.keys(rooms).forEach(roomName => {
                    const room = rooms[roomName];
                    safeRooms[roomName] = {
                        name: room.name || roomName,
                        occupied: room.occupied || false,
                        devices: Array.isArray(room.devices) ? room.devices.map(d => d.name || d) : [],
                        // Add other safe properties as needed, but avoid circular references
                        type: room.type || 'room'
                    };
                });
                
                logger.info(`Returning ${Object.keys(safeRooms).length} safe rooms`, 'socketio-cmd');
                return safeRooms;
            }
            logger.warn('Room component not available', 'socketio-cmd');
            return {};
        } catch (error) {
            logger.error(`Error listing rooms: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    getRoom(params) {
        try {
            const { roomId, action } = params;
            const roomComponent = this.Fluent._component().get('room');
            if (roomComponent && roomComponent.get) {
                const room = roomComponent.get(roomId);
                if (!room) {
                    return { error: `Room "${roomId}" not found` };
                }
                
                // If action is 'describe', use the describe method
                if (action === 'describe' && typeof room.describe === 'function') {
                    return room.describe();
                }
                
                // Return basic room info without circular references
                return {
                    name: room.name || roomId,
                    occupied: room.isOccupied ? room.isOccupied() : false,
                    attributes: room.attributes || {},
                    type: 'room'
                };
            }
            return { message: 'Room component not available' };
        } catch (error) {
            logger.error(`Error getting room: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // Scenario Commands
    listScenarios(params) {
        try {
            return {
                scenarios: Object.keys(this.Fluent.scenarios),
                count: Object.keys(this.Fluent.scenarios).length
            };
        } catch (error) {
            logger.error(`Error listing scenarios: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    getScenario(params) {
        try {
            const { scenarioName, action } = params;
            const scenario = this.Fluent._scenario().get(scenarioName);
            
            if (!scenario) {
                return { error: `Scenario '${scenarioName}' not found` };
            }

            // If action is 'describe', return the clean description
            if (action === 'describe') {
                return scenario.describe();
            }

            // Otherwise, return a safe summary to avoid circular references
            return {
                description: scenario.description,
                runnable: scenario.runnable,
                testMode: scenario.testMode
            };
        } catch (error) {
            logger.error(`Error getting scenario: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    runScenario(params) {
        try {
            const { scenarioName } = params;
            const scenario = this.Fluent._scenario().get(scenarioName);
            if (scenario) {
                scenario.run();
                return { message: `Scenario '${scenarioName}' executed` };
            }
            return { error: `Scenario '${scenarioName}' not found` };
        } catch (error) {
            logger.error(`Error running scenario: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    stopScenario(params) {
        try {
            const { scenarioName } = params;
            const scenario = this.Fluent._scenario().get(scenarioName);
            if (scenario && scenario.stop) {
                scenario.stop();
                return { message: `Scenario '${scenarioName}' stopped` };
            }
            return { error: `Scenario '${scenarioName}' not found or cannot be stopped` };
        } catch (error) {
            logger.error(`Error stopping scenario: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // Scene Commands
    listScenes(params) {
        try {
            const sceneComponent = this.Fluent._component().get('scene');
            if (sceneComponent) {
                const scenes = sceneComponent.scenes || {};
                const sceneCount = Object.keys(scenes).length;
                logger.info(`Scene component found, scenes count: ${sceneCount}`, 'socketio-cmd');
                
                // Create a safe, serializable version of the scenes
                const safeScenes = {};
                Object.keys(scenes).forEach(sceneName => {
                    const scene = scenes[sceneName];
                    safeScenes[sceneName] = {
                        name: scene.name || sceneName,
                        available: true,
                        type: 'scene'
                    };
                });
                
                logger.info(`Returning ${Object.keys(safeScenes).length} safe scenes`, 'socketio-cmd');
                return safeScenes;
            }
            logger.warn('Scene component not available', 'socketio-cmd');
            return {};
        } catch (error) {
            logger.error(`Error listing scenes: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    activateScene(params) {
        try {
            const { sceneName } = params;
            const sceneComponent = this.Fluent._component().get('scene');
            if (sceneComponent && sceneComponent.run) {
                const result = sceneComponent.run(sceneName);
                if (result !== false) {
                    return { message: `Scene '${sceneName}' activated` };
                } else {
                    return { error: `Scene '${sceneName}' not found or failed to run` };
                }
            }
            return { error: 'Scene component not available' };
        } catch (error) {
            logger.error(`Error activating scene: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // System Commands
    getSystemStatus(params) {
        try {
            return {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
                platform: process.platform,
                timestamp: new Date(),
                components: Object.keys(this.Fluent.components)
            };
        } catch (error) {
            logger.error(`Error getting system status: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    getSystemLogs(params) {
        try {
            // This would integrate with the logger to return recent logs
            return { message: 'Log retrieval not implemented yet' };
        } catch (error) {
            logger.error(`Error getting system logs: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // Sound Commands
    playSound(params) {
        try {
            const { soundName } = params;
            const soundComponent = this.Fluent._component().get('sound');
            if (soundComponent && soundComponent.play) {
                soundComponent.play(soundName);
                return { message: `Playing sound: ${soundName}` };
            }
            return { error: 'Sound component not available' };
        } catch (error) {
            logger.error(`Error playing sound: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    sayText(params) {
        try {
            const { text } = params;
            const soundComponent = this.Fluent._component().get('sound');
            if (soundComponent && soundComponent.say) {
                soundComponent.say(text);
                return { message: `Speaking: ${text}` };
            }
            return { error: 'Sound component not available' };
        } catch (error) {
            logger.error(`Error speaking text: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }

    // Assistant Commands
    assistantBroadcast(params) {
        try {
            const { room, message } = params;
            const assistantComponent = this.Fluent._component().get('assistant');
            if (assistantComponent && assistantComponent.broadcast) {
                assistantComponent.broadcast(room, message);
                return { message: `Broadcast to ${room}: ${message}` };
            }
            return { error: 'Assistant component not available' };
        } catch (error) {
            logger.error(`Error broadcasting message: ${error.message}`, 'socketio-cmd');
            return { error: error.message };
        }
    }
}

module.exports = CommandHandler;
