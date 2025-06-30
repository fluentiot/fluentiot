// UI Management for FluentIoT Dashboard
// Handles all UI rendering, interactions, and updates

window.DashboardUI = {
    // Initialize UI components
    initialize: function() {
        this.createNewActivityIndicator();
        this.setupEventListeners();
        window.DashboardState.setUserHasScrolledUp(false);
    },

    // Create new activity indicator
    createNewActivityIndicator: function() {
        const indicator = document.createElement('div');
        indicator.id = 'new-activity-indicator';
        indicator.className = 'fixed bottom-32 right-6 bg-github-blue text-white px-3 py-2 rounded-lg cursor-pointer shadow-lg hidden text-xs z-50 animate-pulse';
        indicator.innerHTML = '↓ New Activity';
        indicator.onclick = this.scrollToBottom;
        document.body.appendChild(indicator);
        
        const elements = window.DashboardState.getDOMElements();
        elements.newActivityIndicator = indicator;
        window.DashboardState.setDOMElements(elements);
    },

    // Scroll management functions
    checkScrollPosition: function() {
        const { activityPanel } = window.DashboardState.getDOMElements();
        if (!activityPanel) return;
        
        const scrollTop = activityPanel.scrollTop;
        const scrollHeight = activityPanel.scrollHeight;
        const clientHeight = activityPanel.clientHeight;
        
        // User has scrolled up if they're not at the bottom (with 20px tolerance)
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - 20;
        window.DashboardState.setUserHasScrolledUp(!isAtBottom);
        
        // Hide new activity indicator if user scrolls to bottom
        if (isAtBottom) {
            window.DashboardUI.hideNewActivityIndicator();
        }
        
        window.DashboardState.setLastScrollTop(scrollTop);
    },

    scrollToBottom: function() {
        const { activityPanel } = window.DashboardState.getDOMElements();
        activityPanel.scrollTop = activityPanel.scrollHeight;
        window.DashboardState.setUserHasScrolledUp(false);
        window.DashboardUI.hideNewActivityIndicator();
    },

    showNewActivityIndicator: function() {
        const { newActivityIndicator } = window.DashboardState.getDOMElements();
        if (window.DashboardState.userHasScrolledUp() && newActivityIndicator) {
            newActivityIndicator.classList.remove('hidden');
        }
    },

    hideNewActivityIndicator: function() {
        const { newActivityIndicator } = window.DashboardState.getDOMElements();
        if (newActivityIndicator) {
            newActivityIndicator.classList.add('hidden');
        }
    },

    // Logging functions
    addLogEntry: function(level, component, message) {
        const { activityLog } = window.DashboardState.getDOMElements();
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
        
        const { bgColor, componentColor } = this.getLogEntryColors(level);
        
        entry.className = `log-entry animate-in ${bgColor} border-l-2 p-2 mb-2 rounded-r text-xs`;
        entry.innerHTML = `
            <div class="flex items-start gap-2">
                <span class="text-github-muted whitespace-nowrap">[${timestamp}]</span> 
                <span class="${componentColor} font-semibold whitespace-nowrap">${component}</span> 
                <span class="flex-1">${message}</span>
            </div>
        `;
        
        activityLog.appendChild(entry);
        
        // Keep only last 500 entries (increased from 100)
        while (activityLog.children.length > 500) {
            activityLog.removeChild(activityLog.firstChild);
        }
        
        // Only auto-scroll if user hasn't scrolled up
        if (!window.DashboardState.userHasScrolledUp()) {
            this.scrollToBottom();
        } else {
            // Show new activity indicator when user has scrolled up
            this.showNewActivityIndicator();
        }
    },

    getLogEntryColors: function(level) {
        const colorMap = {
            debug: { bgColor: 'bg-gray-500/10 border-gray-500', componentColor: 'text-gray-400' },
            warn: { bgColor: 'bg-yellow-500/10 border-yellow-500', componentColor: 'text-yellow-500' },
            error: { bgColor: 'bg-red-500/10 border-red-500', componentColor: 'text-red-500' },
            scenario: { bgColor: 'bg-purple-500/10 border-purple-500', componentColor: 'text-purple-500' },
            cli: { bgColor: 'bg-green-500/10 border-green-500', componentColor: 'text-github-green' },
            info: { bgColor: 'bg-blue-500/10 border-blue-500', componentColor: 'text-github-blue' }
        };
        
        return colorMap[level] || colorMap.info;
    },

    // Event listeners setup
    setupEventListeners: function() {
        const { commandInput, activityPanel } = window.DashboardState.getDOMElements();
        
        // Command input handling
        commandInput.addEventListener('input', window.DashboardCommands.handleCommandInput);
        commandInput.addEventListener('keydown', window.DashboardCommands.handleCommandKeydown);

        // Activity panel scroll monitoring
        activityPanel.addEventListener('scroll', this.checkScrollPosition);

        // Search functionality for all tabs
        const deviceSearchInput = document.getElementById('device-search');
        if (deviceSearchInput) {
            deviceSearchInput.addEventListener('input', this.filterDevices);
        }

        const sceneSearchInput = document.getElementById('scene-search');
        if (sceneSearchInput) {
            sceneSearchInput.addEventListener('input', this.filterScenes);
        }

        const roomSearchInput = document.getElementById('room-search');
        if (roomSearchInput) {
            roomSearchInput.addEventListener('input', this.filterRooms);
        }

        const scenarioSearchInput = document.getElementById('scenario-search');
        if (scenarioSearchInput) {
            scenarioSearchInput.addEventListener('input', this.filterScenarios);
        }
    },

    clearActivityLog: function() {
        const { activityLog } = window.DashboardState.getDOMElements();
        activityLog.innerHTML = '';
        this.addLogEntry('info', 'system', 'Activity log cleared');
    },

    // Utility functions
    updateStats: function() {
        this.updateSearchPlaceholders();
    },

    updateDeviceData: function(data) {
        if (data.device && window.DashboardState.devices()[data.device]) {
            window.DashboardRender.renderDevices();
        }
    },

    updateScenarioData: function(data) {
        // Update scenario data when we receive scenario activity
        // This could be expanded to update specific scenario status
    },

    updateSearchPlaceholders: function() {
        const sceneCount = Object.keys(window.DashboardState.scenes()).length;
        const deviceCount = Object.keys(window.DashboardState.devices()).length;
        const roomCount = Object.keys(window.DashboardState.rooms()).length;
        const scenarioCount = window.DashboardState.scenarios().length;
        
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
    },

    hideLoadingIndicators: function() {
        document.getElementById('devices-loading').style.display = 'none';
        document.getElementById('rooms-loading').style.display = 'none';
        document.getElementById('scenes-loading').style.display = 'none';
        document.getElementById('scenarios-loading').style.display = 'none';
    },

    // Result handlers for different data types
    handleScenesResult: function(result) {
        if (result && typeof result === 'object') {
            window.DashboardState.setScenes(result);
            window.DashboardRender.renderScenes();
            this.updateStats();
            this.addLogEntry('info', 'system', `Loaded ${Object.keys(result).length} scenes`);
        } else {
            this.addLogEntry('warn', 'system', 'No scenes found or invalid format');
            document.getElementById('scenes-loading').style.display = 'none';
            document.getElementById('scenes-list').innerHTML = '<div class="text-github-muted text-xs p-2">No scenes found</div>';
        }
    },

    handleDevicesResult: function(result) {
        if (result && typeof result === 'object') {
            window.DashboardState.setDevices(result);
            window.DashboardRender.renderDevices();
            this.updateStats();
            this.addLogEntry('info', 'system', `Loaded ${Object.keys(result).length} devices`);
        } else {
            this.addLogEntry('warn', 'system', 'No devices found or invalid format');
            document.getElementById('devices-loading').style.display = 'none';
            document.getElementById('devices-list').innerHTML = '<div class="text-github-muted text-xs p-2">No devices found</div>';
        }
    },

    handleRoomsResult: function(result) {
        if (result && typeof result === 'object') {
            window.DashboardState.setRooms(result);
            window.DashboardRender.renderRooms();
            this.updateStats();
            this.addLogEntry('info', 'system', `Loaded ${Object.keys(result).length} rooms`);
        } else {
            this.addLogEntry('warn', 'system', 'No rooms found or invalid format');
            document.getElementById('rooms-loading').style.display = 'none';
            document.getElementById('rooms-list').innerHTML = '<div class="text-github-muted text-xs p-2">No rooms found</div>';
        }
    },

    handleScenariosResult: function(result) {
        if (result && (Array.isArray(result.scenarios) || typeof result === 'object')) {
            const scenarios = Array.isArray(result.scenarios) ? result.scenarios : Object.keys(result);
            window.DashboardState.setScenarios(scenarios);
            window.DashboardRender.renderScenarios();
            this.addLogEntry('info', 'system', `Loaded ${scenarios.length} scenarios`);
        } else {
            this.addLogEntry('warn', 'system', 'No scenarios found or invalid format');
            document.getElementById('scenarios-loading').style.display = 'none';
            document.getElementById('scenarios-list').innerHTML = '<div class="text-github-muted text-xs p-2">No scenarios found</div>';
        }
    },

    handleDeviceInspectResult: function(result) {
        if (result && result.name) {
            const capabilities = result.capabilities ? result.capabilities.join(', ') : 'None';
            const attributes = result.attributes ? Object.entries(result.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') : 'None';
            const deviceInfo = `Device: ${result.name}\nCapabilities: ${capabilities}\nAttributes: ${attributes}`;
            this.addLogEntry('cli', 'device', deviceInfo);
        } else {
            this.addLogEntry('error', 'device', 'Device not found or invalid response');
        }
    },

    handleRoomInspectResult: function(result) {
        if (result) {
            const occupied = result.occupied;
            const occupancyStatus = occupied === true ? 'Occupied' : occupied === false ? 'Vacant' : 'Unknown';
            const devices = result.devices && result.devices.length > 0 ? result.devices.join(', ') : 'None';
            const roomInfo = `Room: ${result.name || 'Unknown'}\nStatus: ${occupancyStatus}\nDevices: ${devices}`;
            this.addLogEntry('cli', 'room', roomInfo);
        } else {
            this.addLogEntry('error', 'room', 'Room not found or invalid response');
        }
    },

    handleScenarioInspectResult: function(result) {
        if (result && result.description) {
            const scenarioInfo = `Scenario: ${result.description}\nRunnable: ${result.runnable ? 'Yes' : 'No'}\nTest Mode: ${result.testMode ? 'Yes' : 'No'}\nTriggers: ${result.triggersCount || 0}\nCallbacks: ${result.callbacksCount || 0}\nSuppressed Until: ${result.suppressUntil ? new Date(result.suppressUntil).toLocaleString() : 'None'}`;
            this.addLogEntry('cli', 'scenario', scenarioInfo);
        } else {
            this.addLogEntry('error', 'scenario', 'Scenario not found or invalid response');
        }
    },

    // Search and filter functions
    filterDevices: function() {
        const searchTerm = document.getElementById('device-search').value.toLowerCase();
        const deviceItems = document.querySelectorAll('.device-item');
        
        deviceItems.forEach(item => {
            const deviceName = item.querySelector('.text-github-text').textContent.toLowerCase();
            item.style.display = deviceName.includes(searchTerm) ? 'block' : 'none';
        });
    },

    filterScenes: function() {
        const searchTerm = document.getElementById('scene-search').value.toLowerCase();
        const sceneItems = document.querySelectorAll('.scene-item');
        
        sceneItems.forEach(item => {
            const sceneName = item.querySelector('.text-github-text').textContent.toLowerCase();
            item.style.display = sceneName.includes(searchTerm) ? 'block' : 'none';
        });
    },

    filterRooms: function() {
        const searchTerm = document.getElementById('room-search').value.toLowerCase();
        const roomItems = document.querySelectorAll('.room-item');
        
        roomItems.forEach(item => {
            const roomName = item.querySelector('.text-github-text').textContent.toLowerCase();
            item.style.display = roomName.includes(searchTerm) ? 'block' : 'none';
        });
    },

    filterScenarios: function() {
        const searchTerm = document.getElementById('scenario-search').value.toLowerCase();
        const scenarioItems = document.querySelectorAll('.scenario-item');
        
        scenarioItems.forEach(item => {
            const scenarioName = item.querySelector('.text-github-text').textContent.toLowerCase();
            item.style.display = scenarioName.includes(searchTerm) ? 'block' : 'none';
        });
    },

    clearDeviceSearch: function() {
        document.getElementById('device-search').value = '';
        this.filterDevices();
    },

    clearSceneSearch: function() {
        document.getElementById('scene-search').value = '';
        this.filterScenes();
    },

    clearRoomSearch: function() {
        document.getElementById('room-search').value = '';
        this.filterRooms();
    },

    clearScenarioSearch: function() {
        document.getElementById('scenario-search').value = '';
        this.filterScenarios();
    },

    // Tab management
    switchTab: function(tabName) {
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
        
        window.DashboardState.setActiveTab(tabName);
        
        // Load data for the tab if needed
        if (tabName === 'scenarios' && window.DashboardState.scenarios().length === 0) {
            window.DashboardSocket.executeCommand('scenario.list', {}, 'list-scenarios');
        }
        if (tabName === 'scenes' && Object.keys(window.DashboardState.scenes()).length === 0) {
            window.DashboardSocket.executeCommand('scene.list', {}, 'list-scenes');
        }
    }
};
