const path = require('path');
const fs = require('fs');

class Config {
  constructor() {
    this.config = this.loadConfig();
  }

  // Function to load the configuration from a given file path
  loadConfig() {
    try {
      // Use require to directly import the configuration from the file
      return require(this.getConfigFilePath());
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
      return null;
    }
  }

  // Function to get the project root directory
  getProjectRoot() {
    // Assuming this script is executed from the project root
    return process.cwd();
  }

  // Function to get the configuration file path
  getConfigFilePath() {
    // Check if fluent.config.js exists in the project root
    const projectConfigPath = path.join(this.getProjectRoot(), 'fluent.config.js');
    if (fs.existsSync(projectConfigPath)) {
      return projectConfigPath;
    }

    // If not, use the default fluent.config.js from the same directory
    return path.join(__dirname, 'fluent.config.js');
  }

  // Function to get a nested property of the configuration using dot notation
  get(key) {
    if (!this.config) {
      console.error('Config not loaded');
      return null;
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.error(`Key not found: ${key}`);
        return null;
      }
    }

    return value;
  }
}

module.exports = new Config();
