# Dashboard Component

A web-based dashboard component for monitoring HomeIot system activity in real-time.

## Features

- **Real-time Monitoring**: Connects to the SocketIO server to receive live activity updates
- **Activity Logging**: Displays system logs, device activity, scenario execution, and more
- **Simple Web Interface**: Clean, responsive HTML interface accessible via web browser
- **Auto-scrolling Log**: Automatically scrolls to show latest activity with a 100-entry limit

## Configuration

Add the dashboard component to your `fluent.config.js`:

```javascript
const config = {
    components: [
        // ... other components
        { name: "dashboard" }
    ],
    // ... other config
    dashboard: {
        enabled: true,
        port: 9003,
        host: "localhost"
    }
};
```

## Usage

1. Start your HomeIot application with the dashboard component enabled
2. Open your web browser and navigate to `http://localhost:9003` (or your configured host:port)
3. The dashboard will automatically connect to the SocketIO server and display real-time activity

## Event Types

The dashboard listens for the following SocketIO events:

- `log` - System log messages (info, warn, error, debug)
- `activity` - General activity feed
- `device_activity` - Device-specific events
- `scenario_activity` - Scenario execution events  
- `scene_activity` - Scene activation events
- `system_activity` - System-level events
- `heartbeat` - System heartbeat/health check

## Files

- `dashboard_component.js` - Main component class
- `templates/index.html` - Web dashboard interface

## Dependencies

- Requires the `socketio` component to be enabled and running
- Uses the same logger and config system as other HomeIot components
