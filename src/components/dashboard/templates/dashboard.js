// FluentIoT Dashboard JavaScript

// Global state
let devices = {};
let rooms = {};
let scenes = {};
let scenarios = [];
let isConnected = false;
let commandCounter = 0;
let activeTab = 'scenes';
let commands = [];

// SocketIO connection
let socket;

// DOM elements
let statusDot, statusText, socketioStatus, activityLog, commandInput, commandSuggestions;

// Initialize dashboard
function initializeDashboard(socketioUrl, authToken) {
    // Get DOM elements
    statusDot = document.getElementById('status-dot');
    statusText = document.getElementById('status-text');
    socketioStatus = document.getElementById('socketio-status');
    activityLog = document.getElementById('activity-log');
    commandInput = document.getElementById('command-input');
    commandSuggestions = document.getElementById('command-suggestions');

    // Setup SocketIO connection
    setupSocketConnection(socketioUrl, authToken);
    
    // Setup event listeners
    setupEventListeners();

    addLogEntry('info', 'system', 'Dashboard initialized');
}

// Setup SocketIO connection
function setupSocketConnection(socketioUrl, authToken) {
    console.log('Attempting to connect to SocketIO server at:', socketioUrl);
    console.log('Using auth token:', authToken ? 'Yes' : 'No');
    
    socket = io(socketioUrl, {
        auth: {
            token: authToken
        }
    });

    setupSocketEventHandlers();
}

// Setup Socket.IO event handlers
function setupSocketEventHandlers() {
    // Connection handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Data event handlers
    socket.on('log', (data) => addLogEntry(data.level || 'info', data.component || 'system', data.message || data));
    socket.on('activity', handleActivity);
    socket.on('device_activity', handleDeviceActivity);
    socket.on('scenario_activity', handleScenarioActivity);
    socket.on('scene_activity', handleSceneActivity);
    socket.on('system_activity', handleSystemActivity);
    socket.on('heartbeat', updateStats);

    // Command response handlers
    socket.on('command_result', handleCommandResult);
    socket.on('command_response', handleCommandResponse);
    socket.on('command_suggestions', handleCommandSuggestions);
}

// Connection event handlers
function handleConnect() {
    isConnected = true;
    statusDot.className = 'w-2 h-2 rounded-full bg-github-green';
    socketioStatus.className = 'w-2 h-2 rounded-full bg-github-green';
    statusText.textContent = 'Connected';
    commandInput.disabled = false;
    addLogEntry('info', 'system', 'Connected to SocketIO server');
    requestData();
}

function handleDisconnect() {
    isConnected = false;
    statusDot.className = 'w-2 h-2 rounded-full bg-github-red';
    socketioStatus.className = 'w-2 h-2 rounded-full bg-github-red';
    statusText.textContent = 'Disconnected';
    commandInput.disabled = true;
    addLogEntry('warn', 'system', 'Disconnected from SocketIO server');
}

function handleConnectError(error) {
    statusText.textContent = 'Connection failed';
    addLogEntry('error', 'system', 'Connection failed: ' + error.message);
}

// Activity event handlers
function handleActivity(data) {
    const message = `${data.type}: ${data.message || JSON.stringify(data.data)}`;
    addLogEntry('info', data.component || 'activity', message);
}

function handleDeviceActivity(data) {
    addLogEntry('info', 'device', data.message || JSON.stringify(data));
    updateDeviceData(data);
}

function handleScenarioActivity(data) {
    addLogEntry('scenario', 'scenario', data.message || JSON.stringify(data));
    updateScenarioData(data);
}

function handleSceneActivity(data) {
    addLogEntry('scenario', 'scene', data.message || JSON.stringify(data));
}

function handleSystemActivity(data) {
    addLogEntry('warn', 'system', data.message || JSON.stringify(data));
}

// Command response handlers
function handleCommandResult(data) {
    console.log('Command result:', data);
    
    if (data.success && data.result && data.result.data) {
        const result = data.result.data;
        
        // Handle different types of command responses
        if (data.commandId === 'list-scenes') {
            handleScenesResult(result);
        } else if (data.commandId === 'list-devices') {
            handleDevicesResult(result);
        } else if (data.commandId === 'list-rooms') {
            handleRoomsResult(result);
        } else if (data.commandId === 'list-scenarios') {
            handleScenariosResult(result);
        } else if (data.commandId && data.commandId.startsWith('inspect-device-')) {
            handleDeviceInspectResult(result);
        } else if (data.commandId && data.commandId.startsWith('inspect-room-')) {
            handleRoomInspectResult(result);
        } else if (data.commandId && data.commandId.startsWith('inspect-scenario-')) {
            handleScenarioInspectResult(result);
        }
    } else if (data.error) {
        addLogEntry('error', 'command', `Command failed: ${data.error}`);
        hideLoadingIndicators();
    } else {
        console.log('Unexpected command result format:', data);
    }
}

function handleCommandResponse(data) {
    addLogEntry(data.success ? 'cli' : 'error', 'cli', data.message);
}

function handleCommandSuggestions(data) {
    if (data && data.suggestions) {
        commands = data.suggestions;
        addLogEntry('info', 'system', `Loaded ${commands.length} available commands`);
        
        const quickCommandsText = document.getElementById('quick-commands-text');
        if (quickCommandsText) {
            quickCommandsText.textContent = commands.slice(0, 8).join(' | ');
        }
    }
}

// Result handlers for different data types
function handleScenesResult(result) {
    if (result && typeof result === 'object') {
        scenes = result;
        renderScenes();
        updateStats();
        addLogEntry('info', 'system', `Loaded ${Object.keys(scenes).length} scenes`);
    } else {
        addLogEntry('warn', 'system', 'No scenes found or invalid format');
        document.getElementById('scenes-loading').style.display = 'none';
        document.getElementById('scenes-list').innerHTML = '<div class="text-github-muted text-xs p-2">No scenes found</div>';
    }
}

function handleDevicesResult(result) {
    if (result && typeof result === 'object') {
        devices = result;
        renderDevices();
        updateStats();
        addLogEntry('info', 'system', `Loaded ${Object.keys(devices).length} devices`);
    } else {
        addLogEntry('warn', 'system', 'No devices found or invalid format');
        document.getElementById('devices-loading').style.display = 'none';
        document.getElementById('devices-list').innerHTML = '<div class="text-github-muted text-xs p-2">No devices found</div>';
    }
}

function handleRoomsResult(result) {
    if (result && typeof result === 'object') {
        rooms = result;
        renderRooms();
        updateStats();
        addLogEntry('info', 'system', `Loaded ${Object.keys(rooms).length} rooms`);
    } else {
        addLogEntry('warn', 'system', 'No rooms found or invalid format');
        document.getElementById('rooms-loading').style.display = 'none';
        document.getElementById('rooms-list').innerHTML = '<div class="text-github-muted text-xs p-2">No rooms found</div>';
    }
}

function handleScenariosResult(result) {
    if (result && (Array.isArray(result.scenarios) || typeof result === 'object')) {
        scenarios = Array.isArray(result.scenarios) ? result.scenarios : Object.keys(result);
        renderScenarios();
        addLogEntry('info', 'system', `Loaded ${scenarios.length} scenarios`);
    } else {
        addLogEntry('warn', 'system', 'No scenarios found or invalid format');
        document.getElementById('scenarios-loading').style.display = 'none';
        document.getElementById('scenarios-list').innerHTML = '<div class="text-github-muted text-xs p-2">No scenarios found</div>';
    }
}

function handleDeviceInspectResult(result) {
    if (result && result.name) {
        const capabilities = result.capabilities ? result.capabilities.join(', ') : 'None';
        const attributes = result.attributes ? Object.entries(result.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') : 'None';
        const deviceInfo = `Device: ${result.name}\nCapabilities: ${capabilities}\nAttributes: ${attributes}`;
        addLogEntry('cli', 'device', deviceInfo);
    } else {
        addLogEntry('error', 'device', 'Device not found or invalid response');
    }
}

function handleRoomInspectResult(result) {
    if (result) {
        const roomInfo = `Room: ${result.name || 'Unknown'}\nStatus: ${result.occupied ? 'Occupied' : 'Vacant'}`;
        addLogEntry('cli', 'room', roomInfo);
    } else {
        addLogEntry('error', 'room', 'Room not found or invalid response');
    }
}

function handleScenarioInspectResult(result) {
    if (result && result.description) {
        const scenarioInfo = `Scenario: ${result.description}\nRunnable: ${result.runnable ? 'Yes' : 'No'}\nTest Mode: ${result.testMode ? 'Yes' : 'No'}\nTriggers: ${result.triggersCount || 0}\nCallbacks: ${result.callbacksCount || 0}\nSuppressed Until: ${result.suppressUntil ? new Date(result.suppressUntil).toLocaleString() : 'None'}`;
        addLogEntry('cli', 'scenario', scenarioInfo);
    } else {
        addLogEntry('error', 'scenario', 'Scenario not found or invalid response');
    }
}

// Utility functions
function hideLoadingIndicators() {
    document.getElementById('devices-loading').style.display = 'none';
    document.getElementById('rooms-loading').style.display = 'none';
    document.getElementById('scenes-loading').style.display = 'none';
    document.getElementById('scenarios-loading').style.display = 'none';
}

function requestData() {
    executeCommand('scene.list', {}, 'list-scenes');
    executeCommand('device.list', {}, 'list-devices');
    executeCommand('room.list', {}, 'list-rooms');
    socket.emit('get_command_suggestions');
}

function executeCommand(command, parameters = {}, commandId = null) {
    if (!commandId) {
        commandId = `cmd-${++commandCounter}`;
    }
    
    socket.emit('execute_command', {
        id: commandId,
        command: command,
        parameters: parameters
    });
}

// Rendering functions
function renderDevices() {
    const container = document.getElementById('devices-list');
    document.getElementById('devices-loading').style.display = 'none';
    
    if (Object.keys(devices).length === 0) {
        container.innerHTML = '<div class="text-github-muted text-xs p-2">No devices found</div>';
        updateSearchPlaceholders();
        return;
    }

    const sortedDeviceNames = Object.keys(devices).sort((a, b) => a.localeCompare(b));

    container.innerHTML = sortedDeviceNames.map(deviceName => {
        const device = devices[deviceName];
        const statusInfo = getDeviceStatusInfo(device);
        const capabilityButtons = renderDeviceCapabilities(deviceName, device.capabilities || []);

        return `
            <div class="device-item border-l-2 border-github-green text-xs mb-1 bg-github-darker/30 rounded-r">
                <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                     onclick="sendCommand('inspect device ${deviceName}')">
                    <span class="text-github-text font-medium">${deviceName}</span>
                    ${statusInfo.html}
                </div>
                <div class="px-2 pb-1">
                    <div class="flex flex-wrap gap-1">${capabilityButtons}</div>
                </div>
            </div>
        `;
    }).join('');

    updateSearchPlaceholders();
    filterDevices();
}

function getDeviceStatusInfo(device) {
    let status = '';
    let statusColor = 'text-github-muted';
    
    if (device.attributes) {
        if (device.attributes.switch !== undefined) {
            status = device.attributes.switch ? 'ON' : 'OFF';
            statusColor = device.attributes.switch ? 'text-github-green' : 'text-github-red';
        } else if (device.attributes.motion !== undefined) {
            status = device.attributes.motion ? 'ACTIVE' : 'INACTIVE';
            statusColor = device.attributes.motion ? 'text-github-yellow' : 'text-github-muted';
        } else if (device.attributes.temperature !== undefined) {
            status = `${device.attributes.temperature}°C`;
            statusColor = 'text-github-text';
        }
    }
    
    return {
        status,
        html: status ? `<span class="${statusColor} text-xs">${status}</span>` : ''
    };
}

function renderDeviceCapabilities(deviceName, capabilities) {
    if (capabilities.length === 0) {
        return '<span class="text-github-muted text-xs">No capabilities</span>';
    }
    
    return capabilities.map(cap => 
        `<button class="capability-btn px-2 py-0.5 rounded text-xs mr-1" 
                 onclick="event.stopPropagation(); executeDeviceCapability('${deviceName}', '${cap}')">${cap}</button>`
    ).join('');
}

function renderRooms() {
    const container = document.getElementById('rooms-list');
    document.getElementById('rooms-loading').style.display = 'none';
    
    if (Object.keys(rooms).length === 0) {
        container.innerHTML = '<div class="text-github-muted text-xs p-2">No rooms found</div>';
        updateSearchPlaceholders();
        return;
    }

    // Sort rooms alphabetically
    const sortedRoomNames = Object.keys(rooms).sort((a, b) => a.localeCompare(b));

    container.innerHTML = sortedRoomNames.map(roomName => {
        const room = rooms[roomName];
        const status = room.occupied ? 'OCCUPIED' : 'VACANT';
        const statusColor = room.occupied ? 'text-github-yellow' : 'text-github-muted';

        return `
            <div class="room-item border-l-2 border-github-yellow text-xs mb-1 bg-github-darker/30 rounded-r">
                <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                     onclick="sendCommand('inspect room ${roomName}')">
                    <span class="text-github-text font-medium">${roomName}</span>
                    <span class="${statusColor}">${status}</span>
                </div>
            </div>
        `;
    }).join('');

    updateSearchPlaceholders();
    filterRooms();
}

function renderScenarios() {
    const container = document.getElementById('scenarios-list');
    document.getElementById('scenarios-loading').style.display = 'none';
    
    if (scenarios.length === 0) {
        container.innerHTML = '<div class="text-github-muted text-xs p-2">No scenarios found</div>';
        updateSearchPlaceholders();
        return;
    }

    // Sort scenarios alphabetically
    const sortedScenarios = scenarios.slice().sort((a, b) => {
        const nameA = typeof a === 'string' ? a : a.name || a;
        const nameB = typeof b === 'string' ? b : b.name || b;
        return nameA.localeCompare(nameB);
    });

    container.innerHTML = sortedScenarios.map(scenario => {
        const scenarioName = typeof scenario === 'string' ? scenario : scenario.name || scenario;
        return `
            <div class="scenario-item border-l-2 border-github-purple text-xs mb-1 bg-github-darker/30 rounded-r">
                <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                     onclick="sendCommand('inspect scenario ${scenarioName}')">
                    <span class="text-github-text font-medium">${scenarioName}</span>
                    <span class="text-github-muted">READY</span>
                </div>
            </div>
        `;
    }).join('');

    updateSearchPlaceholders();
    filterScenarios();
}

function renderScenes() {
    const container = document.getElementById('scenes-list');
    document.getElementById('scenes-loading').style.display = 'none';
    
    if (Object.keys(scenes).length === 0) {
        container.innerHTML = '<div class="text-github-muted text-xs p-2">No scenes found</div>';
        updateSearchPlaceholders();
        return;
    }

    // Sort scenes alphabetically
    const sortedSceneNames = Object.keys(scenes).sort((a, b) => a.localeCompare(b));

    container.innerHTML = sortedSceneNames.map(sceneName => {
        return `
            <div class="scene-item border-l-2 border-github-purple text-xs mb-1 bg-github-darker/30 rounded-r">
                <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                     onclick="sendCommand('activate scene ${sceneName}')">
                    <span class="text-github-text font-medium">${sceneName}</span>
                    <span class="text-github-purple">RUN</span>
                </div>
            </div>
        `;
    }).join('');

    updateSearchPlaceholders();
    filterScenes();
}

// Logging functions
function addLogEntry(level, component, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    
    // Handle object messages
    if (typeof message === 'object' && message !== null) {
        message = JSON.stringify(message, null, 2);
    }
    
    // Convert message to string and handle line breaks
    message = String(message).replace(/\n/g, '<br>');
    
    // Default to info if level is unknown
    if (!level || level === 'unknown') {
        level = 'info';
    }
    
    const { bgColor, componentColor } = getLogEntryColors(level);
    
    entry.className = `log-entry animate-in ${bgColor} border-l-2 p-2 mb-2 rounded-r text-xs`;
    entry.innerHTML = `
        <div class="flex items-start gap-2">
            <span class="text-github-muted whitespace-nowrap">[${timestamp}]</span> 
            <span class="${componentColor} font-semibold whitespace-nowrap">${component}</span> 
            <span class="flex-1">${message}</span>
        </div>
    `;
    
    activityLog.appendChild(entry);
    
    // Keep only last 100 entries
    while (activityLog.children.length > 100) {
        activityLog.removeChild(activityLog.firstChild);
    }
    
    // Auto-scroll to bottom
    const activityPanel = document.getElementById('activity-panel');
    activityPanel.scrollTop = activityPanel.scrollHeight;
}

function getLogEntryColors(level) {
    const colorMap = {
        debug: { bgColor: 'bg-gray-500/10 border-gray-500', componentColor: 'text-gray-400' },
        warn: { bgColor: 'bg-yellow-500/10 border-yellow-500', componentColor: 'text-yellow-500' },
        error: { bgColor: 'bg-red-500/10 border-red-500', componentColor: 'text-red-500' },
        scenario: { bgColor: 'bg-purple-500/10 border-purple-500', componentColor: 'text-purple-500' },
        cli: { bgColor: 'bg-green-500/10 border-green-500', componentColor: 'text-github-green' },
        info: { bgColor: 'bg-blue-500/10 border-blue-500', componentColor: 'text-github-blue' }
    };
    
    return colorMap[level] || colorMap.info;
}

// Command functions
function sendCommand(command) {
    if (!isConnected) {
        addLogEntry('error', 'cli', 'Not connected to server');
        return;
    }

    addLogEntry('cli', 'cli', `> ${command}`);
    
    // Parse specific commands to proper format
    if (command.startsWith('activate scene ')) {
        const sceneName = command.replace('activate scene ', '');
        executeCommand('scene.activate', { sceneName: sceneName });
    } else if (command.startsWith('inspect device ')) {
        const deviceName = command.replace('inspect device ', '');
        executeCommand('device.get', { deviceId: deviceName, action: 'describe' }, `inspect-device-${deviceName}`);
    } else if (command.startsWith('inspect room ')) {
        const roomName = command.replace('inspect room ', '');
        executeCommand('room.get', { roomId: roomName, action: 'describe' }, `inspect-room-${roomName}`);
    } else if (command.startsWith('inspect scenario ')) {
        const scenarioName = command.replace('inspect scenario ', '');
        executeCommand('scenario.get', { scenarioName: scenarioName, action: 'describe' }, `inspect-scenario-${scenarioName}`);
    } else {
        socket.emit('command', { command: command });
    }
    
    commandInput.value = '';
    commandSuggestions.classList.add('hidden');
}

function executeDeviceCapability(deviceName, capabilityName) {
    if (!isConnected) {
        addLogEntry('error', 'cli', 'Not connected to server');
        return;
    }

    addLogEntry('cli', 'cli', `> Executing ${capabilityName} on ${deviceName}`);
    
    const commandId = `execute-capability-${deviceName}-${capabilityName}`;
    executeCommand('device.capability', { 
        deviceId: deviceName, 
        capabilityName: capabilityName 
    }, commandId);
}

// Search and filter functions
function filterDevices() {
    const searchTerm = document.getElementById('device-search').value.toLowerCase();
    const deviceItems = document.querySelectorAll('.device-item');
    
    deviceItems.forEach(item => {
        const deviceName = item.querySelector('.text-github-text').textContent.toLowerCase();
        item.style.display = deviceName.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterScenes() {
    const searchTerm = document.getElementById('scene-search').value.toLowerCase();
    const sceneItems = document.querySelectorAll('.scene-item');
    
    sceneItems.forEach(item => {
        const sceneName = item.querySelector('.text-github-text').textContent.toLowerCase();
        item.style.display = sceneName.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterRooms() {
    const searchTerm = document.getElementById('room-search').value.toLowerCase();
    const roomItems = document.querySelectorAll('.room-item');
    
    roomItems.forEach(item => {
        const roomName = item.querySelector('.text-github-text').textContent.toLowerCase();
        item.style.display = roomName.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterScenarios() {
    const searchTerm = document.getElementById('scenario-search').value.toLowerCase();
    const scenarioItems = document.querySelectorAll('.scenario-item');
    
    scenarioItems.forEach(item => {
        const scenarioName = item.querySelector('.text-github-text').textContent.toLowerCase();
        item.style.display = scenarioName.includes(searchTerm) ? 'block' : 'none';
    });
}

function clearDeviceSearch() {
    document.getElementById('device-search').value = '';
    filterDevices();
}

function clearSceneSearch() {
    document.getElementById('scene-search').value = '';
    filterScenes();
}

function clearRoomSearch() {
    document.getElementById('room-search').value = '';
    filterRooms();
}

function clearScenarioSearch() {
    document.getElementById('scenario-search').value = '';
    filterScenarios();
}

// Tab management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'bg-github-border', 'text-github-text');
        button.classList.add('text-github-muted');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}-content`).classList.remove('hidden');
    
    // Add active class to selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    selectedTab.classList.add('active', 'bg-github-border', 'text-github-text');
    selectedTab.classList.remove('text-github-muted');
    
    activeTab = tabName;
    
    // Load data for the tab if needed
    if (tabName === 'scenarios' && scenarios.length === 0) {
        executeCommand('scenario.list', {}, 'list-scenarios');
    }
    if (tabName === 'scenes' && Object.keys(scenes).length === 0) {
        executeCommand('scene.list', {}, 'list-scenes');
    }
}

// Utility functions
function updateSearchPlaceholders() {
    const sceneCount = Object.keys(scenes).length;
    const deviceCount = Object.keys(devices).length;
    const roomCount = Object.keys(rooms).length;
    const scenarioCount = scenarios.length;
    
    // Update search placeholders with counts
    const sceneSearch = document.getElementById('scene-search');
    if (sceneSearch) {
        sceneSearch.placeholder = `Search ${sceneCount} scene${sceneCount !== 1 ? 's' : ''}...`;
    }
    
    const deviceSearch = document.getElementById('device-search');
    if (deviceSearch) {
        deviceSearch.placeholder = `Search ${deviceCount} device${deviceCount !== 1 ? 's' : ''}...`;
    }
    
    const roomSearch = document.getElementById('room-search');
    if (roomSearch) {
        roomSearch.placeholder = `Search ${roomCount} room${roomCount !== 1 ? 's' : ''}...`;
    }
    
    const scenarioSearch = document.getElementById('scenario-search');
    if (scenarioSearch) {
        scenarioSearch.placeholder = `Search ${scenarioCount} scenario${scenarioCount !== 1 ? 's' : ''}...`;
    }
}

function updateStats() {
    // Remove the old stats display - now handled by search placeholders
    updateSearchPlaceholders();
}

function updateDeviceData(data) {
    if (data.device && devices[data.device]) {
        renderDevices();
    }
}

function updateScenarioData(data) {
    // Update scenario data when we receive scenario activity
    // This could be expanded to update specific scenario status
}

function clearActivityLog() {
    activityLog.innerHTML = '';
    addLogEntry('info', 'system', 'Activity log cleared');
}

// Event listeners setup
function setupEventListeners() {
    // Command input handling
    commandInput.addEventListener('input', handleCommandInput);
    commandInput.addEventListener('keydown', handleCommandKeydown);

    // Search functionality for all tabs
    const deviceSearchInput = document.getElementById('device-search');
    if (deviceSearchInput) {
        deviceSearchInput.addEventListener('input', filterDevices);
    }

    const sceneSearchInput = document.getElementById('scene-search');
    if (sceneSearchInput) {
        sceneSearchInput.addEventListener('input', filterScenes);
    }

    const roomSearchInput = document.getElementById('room-search');
    if (roomSearchInput) {
        roomSearchInput.addEventListener('input', filterRooms);
    }

    const scenarioSearchInput = document.getElementById('scenario-search');
    if (scenarioSearchInput) {
        scenarioSearchInput.addEventListener('input', filterScenarios);
    }
}

function handleCommandInput(e) {
    const value = e.target.value.toLowerCase();
    if (value.length > 0) {
        const matches = commands.filter(cmd => cmd.toLowerCase().includes(value));
        if (matches.length > 0) {
            commandSuggestions.innerHTML = matches.slice(0, 5).map((match, i) => 
                `<div class="p-2 hover:bg-github-border cursor-pointer text-xs ${i === 0 ? 'bg-github-border' : ''}" onclick="commandInput.value='${match}'; commandSuggestions.classList.add('hidden')">${match}</div>`
            ).join('');
            commandSuggestions.classList.remove('hidden');
        } else {
            commandSuggestions.classList.add('hidden');
        }
    } else {
        commandSuggestions.classList.add('hidden');
    }
}

function handleCommandKeydown(e) {
    if (e.key === 'Escape') {
        commandSuggestions.classList.add('hidden');
    } else if (e.key === 'Enter') {
        sendCommand(e.target.value);
    }
}

// Initialize when DOM is loaded - but wait for HTML to call initializeDashboard with parameters
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners only
    setupEventListeners();
});

// Make functions globally available for onclick handlers
window.switchTab = switchTab;
window.sendCommand = sendCommand;
window.executeDeviceCapability = executeDeviceCapability;
window.clearDeviceSearch = clearDeviceSearch;
window.clearSceneSearch = clearSceneSearch;
window.clearRoomSearch = clearRoomSearch;
window.clearScenarioSearch = clearScenarioSearch;
window.clearActivityLog = clearActivityLog;
window.initializeDashboard = initializeDashboard;
