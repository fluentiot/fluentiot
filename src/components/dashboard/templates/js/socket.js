// Socket.IO Management for FluentIoT Dashboard
// Handles all socket connections and event handling

window.DashboardSocket = {
    // Setup SocketIO connection
    setupConnection: function(socketioUrl, authToken) {
        console.log('Attempting to connect to SocketIO server at:', socketioUrl);
        console.log('Using auth token:', authToken ? 'Yes' : 'No');
        
        const socket = io(socketioUrl, {
            auth: {
                token: authToken
            }
        });

        window.DashboardState.setSocket(socket);
        this.setupEventHandlers();
    },

    // Setup Socket.IO event handlers
    setupEventHandlers: function() {
        const socket = window.DashboardState.socket();
        
        // Connection handlers
        socket.on('connect', this.handleConnect);
        socket.on('disconnect', this.handleDisconnect);
        socket.on('connect_error', this.handleConnectError);

        // Data event handlers
        socket.on('log', (data) => window.DashboardUI.addLogEntry(data.level || 'info', data.component || 'system', data.message || data));
        socket.on('activity', this.handleActivity);
        socket.on('device_activity', this.handleDeviceActivity);
        socket.on('room_activity', this.handleRoomActivity);
        socket.on('scenario_activity', this.handleScenarioActivity);
        socket.on('scene_activity', this.handleSceneActivity);
        socket.on('system_activity', this.handleSystemActivity);
        socket.on('heartbeat', window.DashboardUI.updateStats);

        // Command response handlers
        socket.on('command_result', this.handleCommandResult);
        socket.on('command_response', this.handleCommandResponse);
        socket.on('command_suggestions', this.handleCommandSuggestions);
    },

    // Connection event handlers
    handleConnect: function() {
        const { statusDot, statusText, socketioStatus, commandInput } = window.DashboardState.getDOMElements();
        
        window.DashboardState.setIsConnected(true);
        statusDot.className = 'w-2 h-2 rounded-full bg-github-green';
        socketioStatus.className = 'w-2 h-2 rounded-full bg-github-green';
        statusText.textContent = 'Connected';
        commandInput.disabled = false;
        window.DashboardUI.addLogEntry('info', 'system', 'Connected to SocketIO server');
        window.DashboardSocket.requestData();
    },

    handleDisconnect: function() {
        const { statusDot, statusText, socketioStatus, commandInput } = window.DashboardState.getDOMElements();
        
        window.DashboardState.setIsConnected(false);
        statusDot.className = 'w-2 h-2 rounded-full bg-github-red';
        socketioStatus.className = 'w-2 h-2 rounded-full bg-github-red';
        statusText.textContent = 'Disconnected';
        commandInput.disabled = true;
        window.DashboardUI.addLogEntry('warn', 'system', 'Disconnected from SocketIO server');
    },

    handleConnectError: function(error) {
        const { statusText } = window.DashboardState.getDOMElements();
        statusText.textContent = 'Connection failed';
        window.DashboardUI.addLogEntry('error', 'system', 'Connection failed: ' + error.message);
    },

    // Activity event handlers
    handleActivity: function(data) {
        if (window.DashboardState.commands()) {
            const message = `${data.type}: ${data.message || JSON.stringify(data.data)}`;
            window.DashboardUI.addLogEntry('info', data.component || 'activity', message);
        }
    },

    handleDeviceActivity: function(data) {
        window.DashboardUI.addLogEntry('info', 'device', data.message || JSON.stringify(data));
        window.DashboardUI.updateDeviceData(data);
    },

    handleRoomActivity: function(data) {
        window.DashboardUI.addLogEntry('info', 'room', data.message || JSON.stringify(data));
        window.DashboardUI.updateRoomData(data);
    },

    handleScenarioActivity: function(data) {
        window.DashboardUI.addLogEntry('scenario', 'scenario', data.message || JSON.stringify(data));
        window.DashboardUI.updateScenarioData(data);
    },

    handleSceneActivity: function(data) {
        window.DashboardUI.addLogEntry('scenario', 'scene', data.message || JSON.stringify(data));
    },

    handleSystemActivity: function(data) {
        window.DashboardUI.addLogEntry('warn', 'system', data.message || JSON.stringify(data));
    },

    // Command response handlers
    handleCommandResult: function(data) {
        console.log('Command result:', data);
        
        if (data.success && data.result && data.result.data) {
            const result = data.result.data;
            
            // Handle different types of command responses
            if (data.commandId === 'list-scenes') {
                window.DashboardUI.handleScenesResult(result);
            } else if (data.commandId === 'list-devices') {
                window.DashboardUI.handleDevicesResult(result);
            } else if (data.commandId === 'list-rooms' || data.commandId === 'refresh-rooms') {
                window.DashboardUI.handleRoomsResult(result);
            } else if (data.commandId === 'list-scenarios') {
                window.DashboardUI.handleScenariosResult(result);
            } else if (data.commandId && data.commandId.startsWith('inspect-device-')) {
                window.DashboardUI.handleDeviceInspectResult(result);
            } else if (data.commandId && data.commandId.startsWith('inspect-room-')) {
                window.DashboardUI.handleRoomInspectResult(result);
            } else if (data.commandId && data.commandId.startsWith('inspect-scenario-')) {
                window.DashboardUI.handleScenarioInspectResult(result);
            }
        } else if (data.error) {
            window.DashboardUI.addLogEntry('error', 'command', `Command failed: ${data.error}`);
            window.DashboardUI.hideLoadingIndicators();
        } else {
            console.log('Unexpected command result format:', data);
        }
    },

    handleCommandResponse: function(data) {
        window.DashboardUI.addLogEntry(data.success ? 'cli' : 'error', 'cli', data.message);
    },

    handleCommandSuggestions: function(data) {
        if (data && data.suggestions) {
            window.DashboardState.setCommands(data.suggestions);
            window.DashboardUI.addLogEntry('info', 'system', `Loaded ${data.suggestions.length} available commands`);
            
            const quickCommandsText = document.getElementById('quick-commands-text');
            if (quickCommandsText) {
                quickCommandsText.textContent = data.suggestions.slice(0, 8).join(' | ');
            }
        }
    },

    // Request initial data
    requestData: function() {
        this.executeCommand('scene.list', {}, 'list-scenes');
        this.executeCommand('device.list', {}, 'list-devices');
        this.executeCommand('room.list', {}, 'list-rooms');
        window.DashboardState.socket().emit('get_command_suggestions');
    },

    // Execute a command via socket
    executeCommand: function(command, parameters = {}, commandId = null) {
        if (!commandId) {
            commandId = `cmd-${window.DashboardState.incrementCommandCounter()}`;
        }
        
        window.DashboardState.socket().emit('execute_command', {
            id: commandId,
            command: command,
            parameters: parameters
        });
    }
};
