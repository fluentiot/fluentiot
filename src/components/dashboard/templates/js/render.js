// Rendering Management for FluentIoT Dashboard
// Handles all data rendering and display logic

window.DashboardRender = {
    // Device rendering
    renderDevices: function() {
        const devices = window.DashboardState.devices();
        const container = document.getElementById('devices-list');
        document.getElementById('devices-loading').style.display = 'none';
        
        if (Object.keys(devices).length === 0) {
            container.innerHTML = '<div class="text-github-muted text-xs p-2">No devices found</div>';
            window.DashboardUI.updateSearchPlaceholders();
            return;
        }

        const sortedDeviceNames = Object.keys(devices).sort((a, b) => a.localeCompare(b));

        container.innerHTML = sortedDeviceNames.map(deviceName => {
            const device = devices[deviceName];
            const statusInfo = this.getDeviceStatusInfo(device);
            const capabilityButtons = this.renderDeviceCapabilities(deviceName, device.capabilities || []);

            return `
                <div class="device-item border-l-2 border-github-green text-xs mb-1 bg-github-darker/30 rounded-r">
                    <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                         onclick="window.DashboardCommands.sendCommand('inspect device ${deviceName}')">
                        <span class="text-github-text font-medium">${deviceName}</span>
                        ${statusInfo.html}
                    </div>
                    <div class="px-2 pb-1">
                        <div class="flex flex-wrap gap-1">${capabilityButtons}</div>
                    </div>
                </div>
            `;
        }).join('');

        window.DashboardUI.updateSearchPlaceholders();
        window.DashboardUI.filterDevices();
    },

    getDeviceStatusInfo: function(device) {
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
    },

    renderDeviceCapabilities: function(deviceName, capabilities) {
        if (capabilities.length === 0) {
            return '<span class="text-github-muted text-xs">No capabilities</span>';
        }
        
        return capabilities.map(cap => 
            `<button class="capability-btn px-2 py-0.5 rounded text-xs mr-1" 
                     onclick="event.stopPropagation(); window.DashboardCommands.executeDeviceCapability('${deviceName}', '${cap}')">${cap}</button>`
        ).join('');
    },

    // Room rendering
    renderRooms: function() {
        const rooms = window.DashboardState.rooms();
        const container = document.getElementById('rooms-list');
        document.getElementById('rooms-loading').style.display = 'none';
        
        if (Object.keys(rooms).length === 0) {
            container.innerHTML = '<div class="text-github-muted text-xs p-2">No rooms found</div>';
            window.DashboardUI.updateSearchPlaceholders();
            return;
        }

        // Sort rooms alphabetically
        const sortedRoomNames = Object.keys(rooms).sort((a, b) => a.localeCompare(b));

        container.innerHTML = sortedRoomNames.map(roomName => {
            const room = rooms[roomName];
            const status = room.occupied === true ? 'OCCUPIED' : room.occupied === false ? 'VACANT' : 'UNKNOWN';
            const statusColor = room.occupied === true ? 'text-github-green' : room.occupied === false ? 'text-github-blue' : 'text-github-muted';

            return `
                <div class="room-item border-l-2 border-github-yellow text-xs mb-1 bg-github-darker/30 rounded-r">
                    <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                         onclick="window.DashboardCommands.sendCommand('inspect room ${roomName}')">
                        <span class="text-github-text font-medium">${roomName}</span>
                        <span class="${statusColor}">${status}</span>
                    </div>
                </div>
            `;
        }).join('');

        window.DashboardUI.updateSearchPlaceholders();
        window.DashboardUI.filterRooms();
    },

    // Scenario rendering
    renderScenarios: function() {
        const scenarios = window.DashboardState.scenarios();
        const container = document.getElementById('scenarios-list');
        document.getElementById('scenarios-loading').style.display = 'none';
        
        if (scenarios.length === 0) {
            container.innerHTML = '<div class="text-github-muted text-xs p-2">No scenarios found</div>';
            window.DashboardUI.updateSearchPlaceholders();
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
                         onclick="window.DashboardCommands.sendCommand('inspect scenario ${scenarioName}')">
                        <span class="text-github-text font-medium">${scenarioName}</span>
                        <span class="text-github-muted">READY</span>
                    </div>
                </div>
            `;
        }).join('');

        window.DashboardUI.updateSearchPlaceholders();
        window.DashboardUI.filterScenarios();
    },

    // Scene rendering
    renderScenes: function() {
        const scenes = window.DashboardState.scenes();
        const container = document.getElementById('scenes-list');
        document.getElementById('scenes-loading').style.display = 'none';
        
        if (Object.keys(scenes).length === 0) {
            container.innerHTML = '<div class="text-github-muted text-xs p-2">No scenes found</div>';
            window.DashboardUI.updateSearchPlaceholders();
            return;
        }

        // Sort scenes alphabetically
        const sortedSceneNames = Object.keys(scenes).sort((a, b) => a.localeCompare(b));

        container.innerHTML = sortedSceneNames.map(sceneName => {
            return `
                <div class="scene-item border-l-2 border-github-purple text-xs mb-1 bg-github-darker/30 rounded-r">
                    <div class="item-content flex items-center justify-between p-2 hover:bg-github-dark/50 rounded cursor-pointer"
                         onclick="window.DashboardCommands.sendCommand('activate scene ${sceneName}')">
                        <span class="text-github-text font-medium">${sceneName}</span>
                        <span class="text-github-purple">RUN</span>
                    </div>
                </div>
            `;
        }).join('');

        window.DashboardUI.updateSearchPlaceholders();
        window.DashboardUI.filterScenes();
    }
};
