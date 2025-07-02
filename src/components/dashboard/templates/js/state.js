// Dashboard State Management
// Global state variables for the FluentIoT Dashboard

// Data state
let devices = {};
let rooms = {};
let scenes = {};
let scenarios = [];
let commands = [];

// Connection state
let isConnected = false;
let socket;
let commandCounter = 0;

// UI state
let activeTab = 'scenes';

// Settings state
let currentSettings = { theme: 'dark', showDebugMessages: true };
let originalSettings = { theme: 'dark', showDebugMessages: true };

// Command history for up/down arrow navigation
let commandHistory = [];
let commandHistoryIndex = -1;
const MAX_COMMAND_HISTORY = 5;

// Scroll management for activity log
let userHasScrolledUp = false;
let lastScrollTop = 0;

// DOM elements
let statusDot, statusText, socketioStatus, activityLog, commandInput, commandSuggestions, activityPanel, newActivityIndicator;

// Export all state variables and constants
window.DashboardState = {
    // Data
    devices: () => devices,
    setDevices: (value) => devices = value,
    rooms: () => rooms,
    setRooms: (value) => rooms = value,
    scenes: () => scenes,
    setScenes: (value) => scenes = value,
    scenarios: () => scenarios,
    setScenarios: (value) => scenarios = value,
    commands: () => commands,
    setCommands: (value) => commands = value,
    
    // Connection
    isConnected: () => isConnected,
    setIsConnected: (value) => isConnected = value,
    socket: () => socket,
    setSocket: (value) => socket = value,
    commandCounter: () => commandCounter,
    incrementCommandCounter: () => ++commandCounter,
    
    // UI
    activeTab: () => activeTab,
    setActiveTab: (value) => activeTab = value,
    
    // Command history
    commandHistory: () => commandHistory,
    setCommandHistory: (value) => commandHistory = value,
    commandHistoryIndex: () => commandHistoryIndex,
    setCommandHistoryIndex: (value) => commandHistoryIndex = value,
    MAX_COMMAND_HISTORY,
    
    // Settings
    currentSettings: () => currentSettings,
    setCurrentSettings: (value) => currentSettings = value,
    originalSettings: () => originalSettings,
    setOriginalSettings: (value) => originalSettings = value,
    
    // Scroll
    userHasScrolledUp: () => userHasScrolledUp,
    setUserHasScrolledUp: (value) => userHasScrolledUp = value,
    lastScrollTop: () => lastScrollTop,
    setLastScrollTop: (value) => lastScrollTop = value,
    
    // DOM elements
    getDOMElements: () => ({
        statusDot, statusText, socketioStatus, activityLog, 
        commandInput, commandSuggestions, activityPanel, newActivityIndicator,
        settingsButton: document.getElementById('settings-button'),
        saveSettingsButton: document.getElementById('save-settings-button'),
        cancelSettingsButton: document.getElementById('cancel-settings-button'),
        settingsDialog: document.getElementById('settings-dialog'),
        themeSelect: document.getElementById('theme-select'),
        showDebugMessagesCheckbox: document.getElementById('show-debug-messages')
    }),
    setDOMElements: (elements) => {
        statusDot = elements.statusDot;
        statusText = elements.statusText;
        socketioStatus = elements.socketioStatus;
        activityLog = elements.activityLog;
        commandInput = elements.commandInput;
        commandSuggestions = elements.commandSuggestions;
        activityPanel = elements.activityPanel;
        newActivityIndicator = elements.newActivityIndicator;
    }
};
