const fs = require('fs');
const path = require('path');
const logger = require('../../logger');

// Try to load js-yaml, but fall back to manual parsing if not available
let yaml;
try {
    yaml = require('js-yaml');
} catch (error) {
    logger.warn('js-yaml not available, using fallback YAML parsing', 'llm-prompt');
    yaml = null;
}

/**
 * Prompt manager for loading and processing LLM prompt templates
 */
class PromptManager {
    
    /**
     * Constructor
     */
    constructor() {
        this.promptsPath = path.join(__dirname, 'prompts');
        this.defaultPrompt = null;
        this.loadDefaultPrompt();
    }
    
    /**
     * Load the default prompt configuration
     */
    loadDefaultPrompt() {
        try {
            const defaultPromptPath = path.join(this.promptsPath, 'default.yaml');
            
            if (!fs.existsSync(defaultPromptPath)) {
                logger.warn('Default prompt file not found, using fallback', 'llm-prompt');
                this.defaultPrompt = this.getBasicFallbackConfig();
                return;
            }
            
            const yamlContent = fs.readFileSync(defaultPromptPath, 'utf8');
            
            if (yaml) {
                this.defaultPrompt = yaml.load(yamlContent);
                logger.info('Default LLM prompt loaded successfully', 'llm-prompt');
            } else {
                // Simple fallback YAML parsing for basic structure
                logger.info('Using fallback YAML parsing for prompt', 'llm-prompt');
                this.defaultPrompt = this.parseSimpleYaml(yamlContent);
            }
        } catch (error) {
            logger.error(`Failed to load default prompt: ${error.message}`, 'llm-prompt');
            this.defaultPrompt = this.getBasicFallbackConfig();
        }
    }
    
    /**
     * Build system prompt with context data
     * 
     * @param {Object} systemContext - Context data for prompt placeholders
     * @returns {string} Formatted system prompt
     */
    buildSystemPrompt(systemContext) {
        if (!this.defaultPrompt) {
            logger.warn('No prompt configuration available, using fallback', 'llm-prompt');
            return this.buildFallbackPrompt(systemContext);
        }
        
        let prompt = this.defaultPrompt.system_prompt;
        
        // Replace placeholders
        const placeholders = this.defaultPrompt.placeholders || {};
        
        // Replace {{commands}}
        if (prompt.includes('{{commands}}')) {
            const commandsText = this.formatCommands(systemContext.commands, placeholders.commands);
            prompt = prompt.replace('{{commands}}', commandsText);
        }
        
        // Replace {{devices}}
        if (prompt.includes('{{devices}}')) {
            const devicesText = this.formatDevices(systemContext.devices, placeholders.devices);
            prompt = prompt.replace('{{devices}}', devicesText);
        }
        
        // Replace {{scenes}}
        if (prompt.includes('{{scenes}}')) {
            const scenesText = this.formatScenes(systemContext.scenes, placeholders.scenes);
            prompt = prompt.replace('{{scenes}}', scenesText);
        }
        
        // Replace {{rooms}}
        if (prompt.includes('{{rooms}}')) {
            const roomsText = this.formatRooms(systemContext.rooms, placeholders.rooms);
            prompt = prompt.replace('{{rooms}}', roomsText);
        }
        
        return prompt;
    }
    
    /**
     * Format commands for the prompt
     * 
     * @param {Object} commands - Available commands
     * @param {Object} formatConfig - Format configuration
     * @returns {string} Formatted commands text
     */
    formatCommands(commands, formatConfig) {
        if (!commands || Object.keys(commands).length === 0) {
            return 'No commands available';
        }
        
        const formatType = formatConfig?.format || 'markdown_list';
        
        if (formatType === 'markdown_list') {
            let text = '';
            Object.entries(commands).forEach(([cmdName, cmdInfo]) => {
                const params = cmdInfo.parameters ? 
                    cmdInfo.parameters.map(p => `${p.name}: ${p.type}${p.required ? ' (required)' : ''}`).join(', ') : 
                    'none';
                text += `- **${cmdName}**: ${cmdInfo.description || 'No description'}\nParameters: {${params}}\n\n`;
            });
            return text;
        }
        
        return JSON.stringify(commands, null, 2);
    }
    
    /**
     * Format devices for the prompt
     * 
     * @param {Object} devices - Available devices
     * @param {Object} formatConfig - Format configuration
     * @returns {string} Formatted devices text
     */
    formatDevices(devices, formatConfig) {
        if (!devices || Object.keys(devices).length === 0) {
            return 'No devices available';
        }
        
        const formatType = formatConfig?.format || 'markdown_list';
        
        if (formatType === 'markdown_list') {
            let text = '';
            Object.entries(devices).forEach(([deviceName, device]) => {
                const capabilities = device.capabilities ? device.capabilities.join(', ') : 'none';
                const attributes = device.attributes ? 
                    Object.entries(device.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') : 
                    'none';
                text += `- **${deviceName}**:\nDevice Alias: ${deviceName}\nCapabilities: [${capabilities}]\nCurrent state: {${attributes}}\n\n`;
            });
            return text;
        }
        
        return JSON.stringify(devices, null, 2);
    }
    
    /**
     * Format scenes for the prompt
     * 
     * @param {Object} scenes - Available scenes
     * @param {Object} formatConfig - Format configuration
     * @returns {string} Formatted scenes text
     */
    formatScenes(scenes, formatConfig) {
        if (!scenes || Object.keys(scenes).length === 0) {
            return 'No scenes available';
        }
        
        const formatType = formatConfig?.format || 'comma_separated';
        
        if (formatType === 'comma_separated') {
            return Object.keys(scenes).join(', ');
        }
        
        return JSON.stringify(scenes, null, 2);
    }
    
    /**
     * Format rooms for the prompt
     * 
     * @param {Object} rooms - Available rooms
     * @param {Object} formatConfig - Format configuration
     * @returns {string} Formatted rooms text
     */
    formatRooms(rooms, formatConfig) {
        if (!rooms || Object.keys(rooms).length === 0) {
            return 'No rooms available';
        }
        
        const formatType = formatConfig?.format || 'markdown_list';
        
        if (formatType === 'markdown_list') {
            let text = '';
            Object.entries(rooms).forEach(([roomName, room]) => {
                const status = room.occupied ? 'occupied' : 'vacant';
                text += `- **${roomName}**: ${status}\n`;
            });
            return text;
        }
        
        return JSON.stringify(rooms, null, 2);
    }
    
    /**
     * Build fallback prompt when YAML loading fails
     * 
     * @param {Object} systemContext - Context data
     * @returns {string} Fallback prompt
     */
    buildFallbackPrompt(systemContext) {
        const fallbackPrompt = `You are a smart home assistant. Convert natural language to specific commands.

AVAILABLE COMMANDS:
${this.formatCommands(systemContext.commands, { format: 'markdown_list' })}

CURRENT DEVICES:
${this.formatDevices(systemContext.devices, { format: 'markdown_list' })}

AVAILABLE SCENES:
${this.formatScenes(systemContext.scenes, { format: 'comma_separated' })}

Response format:
{
  "commands": [
    {"command": "command.name", "parameters": {"param1": "value1"}}
  ],
  "explanation": "Brief explanation of what will be done"
}

Important: Only use commands and devices that exist in the lists above. Respond with ONLY the JSON object.`;
        
        return fallbackPrompt;
    }
    
    /**
     * Simple YAML parser for basic structure when js-yaml is not available
     * Only handles the basic structure we need
     * 
     * @param {string} yamlContent - YAML content to parse
     * @returns {Object} Parsed object
     */
    parseSimpleYaml(yamlContent) {
        try {
            // Extract system_prompt (multiline string after system_prompt: |)
            const systemPromptMatch = yamlContent.match(/system_prompt:\s*\|\s*\n((?:\s{2}.*\n?)*)/);
            const systemPrompt = systemPromptMatch ? 
                systemPromptMatch[1].replace(/^  /gm, '').trim() : 
                this.getBasicFallbackPrompt();
            
            return {
                system_prompt: systemPrompt,
                placeholders: {
                    commands: { format: 'markdown_list' },
                    devices: { format: 'markdown_list' },
                    scenes: { format: 'comma_separated' },
                    rooms: { format: 'markdown_list' }
                }
            };
        } catch (error) {
            logger.warn(`Simple YAML parsing failed: ${error.message}`, 'llm-prompt');
            return this.getBasicFallbackConfig();
        }
    }

    /**
     * Get basic fallback configuration when YAML loading fails
     * 
     * @returns {Object} Basic fallback configuration
     */
    getBasicFallbackConfig() {
        return {
            system_prompt: this.getBasicFallbackPrompt(),
            placeholders: {
                commands: { format: 'markdown_list' },
                devices: { format: 'markdown_list' },
                scenes: { format: 'comma_separated' },
                rooms: { format: 'markdown_list' }
            }
        };
    }

    /**
     * Get basic fallback prompt text
     * 
     * @returns {string} Basic fallback prompt
     */
    getBasicFallbackPrompt() {
        return `You are a smart home assistant. Convert natural language to specific commands.

AVAILABLE COMMANDS:
{{commands}}

CURRENT DEVICES:
{{devices}}

AVAILABLE SCENES:
{{scenes}}

ROOM INFORMATION:
{{rooms}}

Instructions:
- Only use commands from the "Available Commands" section
- Only reference devices that exist in "Current Devices"
- For device control, use the device alias shown in the device list as the deviceId parameter
- NEVER use internal Tuya device IDs
- Always respond with valid JSON in the specified format
- Respond ONLY with the JSON object, no additional text

Response format:
{
  "commands": [
    {"command": "command.name", "parameters": {"param1": "value1"}}
  ],
  "explanation": "Brief explanation of what will be done"
}

For errors:
{
  "commands": [],
  "explanation": "Request could not be processed",
  "error": "Error message explaining why"
}`;
    }
}

module.exports = PromptManager;
