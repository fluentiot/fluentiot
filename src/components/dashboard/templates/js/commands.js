// Command Management for FluentIoT Dashboard
// Handles command input, history, and execution

window.DashboardCommands = {
    // Command history functions
    addToCommandHistory: function(command) {
        const commandHistory = window.DashboardState.commandHistory();
        
        // Don't add empty commands or duplicates
        if (!command.trim() || commandHistory[0] === command.trim()) {
            return;
        }
        
        // Remove command if it exists elsewhere in history
        const existingIndex = commandHistory.indexOf(command.trim());
        if (existingIndex > -1) {
            commandHistory.splice(existingIndex, 1);
        }
        
        // Add to beginning of history
        commandHistory.unshift(command.trim());
        
        // Keep only MAX_COMMAND_HISTORY items
        if (commandHistory.length > window.DashboardState.MAX_COMMAND_HISTORY) {
            commandHistory.splice(window.DashboardState.MAX_COMMAND_HISTORY);
        }
        
        // Reset history index
        window.DashboardState.setCommandHistoryIndex(-1);
        window.DashboardState.setCommandHistory(commandHistory);
    },

    navigateCommandHistory: function(direction) {
        const commandHistory = window.DashboardState.commandHistory();
        const { commandInput } = window.DashboardState.getDOMElements();
        
        if (commandHistory.length === 0) return;
        
        let currentIndex = window.DashboardState.commandHistoryIndex();
        
        if (direction === 'up') {
            currentIndex = Math.min(currentIndex + 1, commandHistory.length - 1);
        } else if (direction === 'down') {
            currentIndex = Math.max(currentIndex - 1, -1);
        }
        
        window.DashboardState.setCommandHistoryIndex(currentIndex);
        
        if (currentIndex === -1) {
            commandInput.value = '';
        } else {
            commandInput.value = commandHistory[currentIndex];
            // Select all text for easy replacement
            commandInput.select();
        }
    },

    // Command input handlers
    handleCommandInput: function(e) {
        const { commandSuggestions } = window.DashboardState.getDOMElements();
        const commands = window.DashboardState.commands();
        const value = e.target.value.toLowerCase();
        
        if (value.length > 0) {
            const matches = commands.filter(cmd => cmd.toLowerCase().includes(value));
            if (matches.length > 0) {
                commandSuggestions.innerHTML = matches.slice(0, 5).map((match, i) => 
                    `<div class="p-2 hover:bg-github-border cursor-pointer text-xs ${i === 0 ? 'bg-github-border' : ''}" onclick="window.DashboardCommands.selectSuggestion('${match}')">${match}</div>`
                ).join('');
                commandSuggestions.classList.remove('hidden');
            } else {
                commandSuggestions.classList.add('hidden');
            }
        } else {
            commandSuggestions.classList.add('hidden');
        }
    },

    handleCommandKeydown: function(e) {
        const { commandSuggestions } = window.DashboardState.getDOMElements();
        
        if (e.key === 'Escape') {
            commandSuggestions.classList.add('hidden');
        } else if (e.key === 'Enter') {
            window.DashboardCommands.sendCommand(e.target.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent cursor movement
            window.DashboardCommands.navigateCommandHistory('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault(); // Prevent cursor movement
            window.DashboardCommands.navigateCommandHistory('down');
        }
    },

    selectSuggestion: function(command) {
        const { commandInput, commandSuggestions } = window.DashboardState.getDOMElements();
        commandInput.value = command;
        commandSuggestions.classList.add('hidden');
    },

    // Command execution
    sendCommand: function(command) {
        const { commandInput, commandSuggestions } = window.DashboardState.getDOMElements();
        
        if (!window.DashboardState.isConnected()) {
            window.DashboardUI.addLogEntry('error', 'cli', 'Not connected to server');
            return;
        }

        // Add to command history before clearing input
        this.addToCommandHistory(command);

        window.DashboardUI.addLogEntry('cli', 'cli', `> ${command}`);
        
        // Parse specific commands to proper format
        if (command.startsWith('activate scene ')) {
            const sceneName = command.replace('activate scene ', '');
            window.DashboardSocket.executeCommand('scene.activate', { sceneName: sceneName });
        } else if (command.startsWith('inspect device ')) {
            const deviceName = command.replace('inspect device ', '');
            window.DashboardSocket.executeCommand('device.get', { deviceId: deviceName, action: 'describe' }, `inspect-device-${deviceName}`);
        } else if (command.startsWith('inspect room ')) {
            const roomName = command.replace('inspect room ', '');
            window.DashboardSocket.executeCommand('room.get', { roomId: roomName, action: 'describe' }, `inspect-room-${roomName}`);
        } else if (command.startsWith('inspect scenario ')) {
            const scenarioName = command.replace('inspect scenario ', '');
            window.DashboardSocket.executeCommand('scenario.get', { scenarioName: scenarioName, action: 'describe' }, `inspect-scenario-${scenarioName}`);
        } else {
            window.DashboardState.socket().emit('command', { command: command });
        }
        
        commandInput.value = '';
        commandSuggestions.classList.add('hidden');
    },

    executeDeviceCapability: function(deviceName, capabilityName) {
        if (!window.DashboardState.isConnected()) {
            window.DashboardUI.addLogEntry('error', 'cli', 'Not connected to server');
            return;
        }

        window.DashboardUI.addLogEntry('cli', 'cli', `> Executing ${capabilityName} on ${deviceName}`);
        
        const commandId = `execute-capability-${deviceName}-${capabilityName}`;
        window.DashboardSocket.executeCommand('device.capability', { 
            deviceId: deviceName, 
            capabilityName: capabilityName 
        }, commandId);
    }
};
