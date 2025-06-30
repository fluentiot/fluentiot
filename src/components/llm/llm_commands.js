const Command = require('../command');
const logger = require('../../logger');

/**
 * LLM-related commands for natural language processing
 */
class LLMCommands extends Command {
    
    getComponentName() {
        return 'llm';
    }
    
    getCommands() {
        return {
            'llm.process': {
                handler: this.processNaturalLanguage.bind(this),
                description: 'Process natural language input and convert to executable commands',
                parameters: [
                    { name: 'input', type: 'string', required: true, description: 'Natural language input to process' }
                ]
            },
            'llm.status': {
                handler: this.getStatus.bind(this),
                description: 'Get status of LLM component and provider availability',
                parameters: []
            }
        };
    }
    
    getCommandSuggestions() {
        return [
            'turn on [device name]',
            'turn off [device name]',
            'activate [scene name]',
            'make it dark in [room]',
            'turn off all lights'
        ];
    }
    
    /**
     * Process natural language input
     * 
     * @param {Object} params - Parameters containing the input
     * @returns {Object} Processing result
     */
    async processNaturalLanguage(params) {
        try {
            const { input } = params;
            const llmComponent = this.getComponent('llm');
            
            if (!llmComponent) {
                return { 
                    error: 'LLM component not available',
                    explanation: 'Natural language processing is not enabled'
                };
            }
            
            if (!llmComponent.isEnabled()) {
                return { 
                    error: 'LLM component is disabled',
                    explanation: 'Natural language processing is disabled in configuration'
                };
            }
            
            this.logSuccess(`Processing natural language input: "${input}"`);
            const result = await llmComponent.processNaturalLanguage(input);
            
            if (result.success) {
                this.logSuccess(`LLM processed input successfully: ${result.explanation}`);
            } else {
                logger.warn(`LLM processing failed: ${result.error}`, 'llm');
            }
            
            return result;
            
        } catch (error) {
            return this.handleError('processing natural language', error);
        }
    }
    
    /**
     * Get LLM component status
     * 
     * @param {Object} params - Parameters (none required)
     * @returns {Object} Status information
     */
    getStatus(params) {
        try {
            const llmComponent = this.getComponent('llm');
            
            if (!llmComponent) {
                return {
                    enabled: false,
                    available: false,
                    provider: null,
                    status: 'LLM component not loaded'
                };
            }
            
            return llmComponent.getStatus();
            
        } catch (error) {
            return this.handleError('getting LLM status', error);
        }
    }
}

module.exports = LLMCommands;
