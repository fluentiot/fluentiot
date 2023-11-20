const path = require('path');
const appRoot = require('app-root-path');

class Logger {
    constructor() {
        this.types = {
            'log': { color: "\x1b[37m", level: 0 },
            'info': { color: "\x1b[36m", level: 1 },
            'warn': { color: "\x1b[33m", level: 2 },
            'error': { color: "\x1b[31m", level: 3 },
            'debug': { color: "\x1b[35m", level: 4 },
        };

        Object.keys(this.types).forEach((type) => {
            this[type] = (...args) => { this._log(type, ...args); }
        });

        // Load config
        const projectRoot = appRoot.path;
        const configPath = path.join(projectRoot, 'fluent.config.js');
        this.config = require(configPath);
    }

    _getCurrentTimestamp() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    _getLogLevel(component) {
        const configLevels = this.config.logging.levels;
        const type = configLevels[component] ? configLevels[component] : configLevels.default;
        return this.types[type].level;
    }

    _log(type, message, component = 'default') {
        const timestamp = this._getCurrentTimestamp();
        const coloredType = this.types[type].color + type.toUpperCase() + "\x1b[0m"; // Reset color
        const logLevel = this._getLogLevel(component);

        if (this.types[type].level <= logLevel) {
            const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
            if(component === 'default') {
                console.log(`[${timestamp}] [${coloredType}] ${formattedMessage}`);
            }
            else {
                console.log(`[${timestamp}] [${coloredType}] [${component}] ${formattedMessage}`);
            }
        }
    }
}

module.exports = new Logger();
