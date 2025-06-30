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
                this.defaultPrompt = this.getFallbackPrompt();
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
            this.defaultPrompt = this.getFallbackPrompt();
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
                text += `- **${cmdName}**: ${cmdInfo.description || 'No description'}\n  - Parameters: {${params}}\n`;
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
                text += `- **${deviceName}**: \n  - Capabilities: [${capabilities}]\n  - Current state: {${attributes}}\n`;
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
     * Get expected output format
     * 
     * @returns {Object} Expected output configuration
     */
    getExpectedOutput() {
        return this.defaultPrompt?.expected_output || {
            format: 'json',
            schema: {
                type: 'object',
                required: ['commands', 'explanation'],
                properties: {
                    commands: { type: 'array' },
                    explanation: { type: 'string' }
                }
            }
        };
    }
    
    /**
     * Get examples from the prompt configuration
     * 
     * @returns {Array} Examples array
     */
    getExamples() {
        return this.defaultPrompt?.examples || [];
    }
    
    /**
     * Get fallback prompt configuration
     * 
     * @returns {Object} Fallback prompt
     */
    getFallbackPrompt() {
        return {
            system_prompt: `You are a smart home assistant. Convert natural language to specific commands.

AVAILABLE COMMANDS:
{{commands}}

CURRENT DEVICES:
{{devices}}

AVAILABLE SCENES:
{{scenes}}

Response format:
{
  "commands": [
    {"command": "command.name", "parameters": {"param1": "value1"}}
  ],
  "explanation": "Brief explanation of what will be done"
}

Important: Only use commands and devices that exist in the lists above.`,
            placeholders: {
                commands: { format: 'markdown_list' },
                devices: { format: 'markdown_list' },
                scenes: { format: 'comma_separated' },
                rooms: { format: 'markdown_list' }
            }
        };
    }
    
    /**
     * Build fallback prompt when YAML loading fails
     * 
     * @param {Object} systemContext - Context data
     * @returns {string} Fallback prompt
     */
    buildFallbackPrompt(systemContext) {
        const fallback = this.getFallbackPrompt();
        let prompt = fallback.system_prompt;
        
        // Simple replacements
        prompt = prompt.replace('{{commands}}', this.formatCommands(systemContext.commands, fallback.placeholders.commands));
        prompt = prompt.replace('{{devices}}', this.formatDevices(systemContext.devices, fallback.placeholders.devices));
        prompt = prompt.replace('{{scenes}}', this.formatScenes(systemContext.scenes, fallback.placeholders.scenes));
        prompt = prompt.replace('{{rooms}}', this.formatRooms(systemContext.rooms, fallback.placeholders.rooms));
        
        return prompt;
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
                this.getFallbackPrompt().system_prompt;
            
            return {
                system_prompt: systemPrompt,
                placeholders: {
                    commands: { format: 'markdown_list' },
                    devices: { format: 'markdown_list' },
                    scenes: { format: 'comma_separated' },
                    rooms: { format: 'markdown_list' }
                },
                expected_output: {
                    format: 'json',
                    schema: {
                        type: 'object',
                        required: ['commands', 'explanation'],
                        properties: {
                            commands: { type: 'array' },
                            explanation: { type: 'string' }
                        }
                    }
                }
            };
        } catch (error) {
            logger.warn(`Simple YAML parsing failed: ${error.message}`, 'llm-prompt');
            return this.getFallbackPrompt();
        }
    }
}

module.exports = PromptManager;
