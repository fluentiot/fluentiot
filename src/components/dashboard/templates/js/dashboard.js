// FluentIoT Dashboard Main Module
// Coordinates all dashboard modules and handles initialization

window.Dashboard = {
    // Initialize dashboard with SocketIO configuration
    initialize: function(socketioUrl, authToken) {
        // Get DOM elements
        const elements = {
            statusDot: document.getElementById('status-dot'),
            statusText: document.getElementById('status-text'),
            socketioStatus: document.getElementById('socketio-status'),
            activityLog: document.getElementById('activity-log'),
            commandInput: document.getElementById('command-input'),
            commandSuggestions: document.getElementById('command-suggestions'),
            activityPanel: document.getElementById('activity-panel'),
            newActivityIndicator: null // Will be created by UI module
        };

        // Set DOM elements in state
        window.DashboardState.setDOMElements(elements);

        // Initialize UI components
        window.DashboardUI.initialize();

        // Setup SocketIO connection
        window.DashboardSocket.setupConnection(socketioUrl, authToken);

        window.DashboardUI.addLogEntry('info', 'system', 'Dashboard initialized');
    }
};

// Global function exports for onclick handlers and external access
window.initializeDashboard = window.Dashboard.initialize;
window.switchTab = window.DashboardUI.switchTab;
window.sendCommand = window.DashboardCommands.sendCommand;
window.executeDeviceCapability = window.DashboardCommands.executeDeviceCapability;
window.clearDeviceSearch = window.DashboardUI.clearDeviceSearch;
window.clearSceneSearch = window.DashboardUI.clearSceneSearch;
window.clearRoomSearch = window.DashboardUI.clearRoomSearch;
window.clearScenarioSearch = window.DashboardUI.clearScenarioSearch;
window.clearActivityLog = window.DashboardUI.clearActivityLog;
window.scrollToBottom = window.DashboardUI.scrollToBottom;

// Initialize when DOM is loaded - but wait for HTML to call initializeDashboard with parameters
document.addEventListener('DOMContentLoaded', function() {
    // Just wait for initializeDashboard to be called from the HTML template
    console.log('Dashboard modules loaded and ready for initialization');
});
