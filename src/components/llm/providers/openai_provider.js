const BaseLLMProvider = require('./base_provider');
const logger = require('../../../logger');
const https = require('https');
const PromptManager = require('../prompt_manager');

/**
 * OpenAI API provider for LLM processing
 * Integrates with OpenAI's chat completion API
 * 
 * @extends BaseLLMProvider
 * @class
 */
class OpenAIProvider extends BaseLLMProvider {
    
    /**
     * Constructor
     * 
     * @param {Object} config - OpenAI configuration
     */
    constructor(config) {
        super(config);
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4o-mini';
        this.maxTokens = config.maxTokens || 500;
        this.temperature = config.temperature || 0.1;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.promptManager = new PromptManager();
    }
    
    /**
     * Initialize the OpenAI provider
     * 
     * @returns {Promise<void>}
     */
    async initialize() {
        if (!this.validateConfig()) {
            throw new Error('OpenAI provider configuration is invalid');
        }
        
        try {
            // Test the API key with a simple request
            await this.testConnection();
            this.isReady = true;
            logger.info('OpenAI provider initialized successfully', 'llm');
        } catch (error) {
            logger.error(`OpenAI provider initialization failed: ${error.message}`, 'llm');
            throw error;
        }
    }
    
    /**
     * Process natural language input using OpenAI
     * 
     * @param {string} input - Natural language input from user
     * @param {Object} systemContext - Current system state and available commands
     * @returns {Promise<Object>} Structured response with commands and explanation
     */
    async processNaturalLanguage(input, systemContext) {
        if (!this.isReady) {
            throw new Error('OpenAI provider is not ready. Call initialize() first.');
        }
        
        try {
            const systemPrompt = this.promptManager.buildSystemPrompt(systemContext);
            const userPrompt = `Convert this request to JSON commands: "${input}"`;
            
            // Debug logging
            logger.debug(`OpenAI System Prompt:\n${systemPrompt}`, 'llm-openai');
            logger.debug(`OpenAI User Query: ${userPrompt}`, 'llm-openai');
            
            const response = await this.makeAPIRequest(systemPrompt, userPrompt);
            
            logger.debug(`OpenAI Raw Response: ${JSON.stringify(response, null, 2)}`, 'llm-openai');
            
            return this.parseResponse(response);
            
        } catch (error) {
            logger.error(`OpenAI processing failed: ${error.message}`, 'llm');
            throw error;
        }
    }
    
    /**
     * Make API request to OpenAI
     * 
     * @param {string} systemPrompt - System prompt
     * @param {string} userPrompt - User prompt
     * @returns {Promise<Object>} API response
     */
    async makeAPIRequest(systemPrompt, userPrompt) {
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature
        };
        
        const postData = JSON.stringify(requestBody);
        
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`OpenAI API error: ${res.statusCode} - ${response.error?.message || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(new Error(`OpenAI API request failed: ${error.message}`));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('OpenAI API request timeout'));
            });
              req.write(postData);
            req.end();
        });
    }
    
    /**
     * Strip markdown code block wrappers from content
     * 
     * @param {string} content - Content that may be wrapped in code blocks
     * @returns {string} Clean content without code block wrappers
     */
    stripCodeBlocks(content) {
        // Remove leading/trailing whitespace
        const trimmed = content.trim();
        
        // Check if content is wrapped in code blocks
        const codeBlockPattern = /^```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```$/;
        const match = trimmed.match(codeBlockPattern);
        
        if (match) {
            // Return the content inside the code blocks
            return match[1].trim();
        }
        
        // If no code blocks found, return original content
        return trimmed;
    }

    /**
     * Parse OpenAI response and extract commands
     * 
     * @param {Object} response - OpenAI API response
     * @returns {Object} Parsed commands and explanation
     */
    parseResponse(response) {
        try {
            const content = response.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No content in OpenAI response');
            }
            
            // Strip code block wrappers if present
            const cleanedContent = this.stripCodeBlocks(content);
            
            // Try to parse as JSON
            const parsed = JSON.parse(cleanedContent);
            
            // Handle different response formats
            let commands = [];
            let explanation = '';
            let error = null;
            
            // Check if this is the expected format with commands array
            if (parsed.commands && Array.isArray(parsed.commands)) {
                commands = parsed.commands;
                explanation = parsed.explanation || 'Commands processed by LLM';
                error = parsed.error || null;
            }
            // Handle single command format (when OpenAI doesn't follow the array format)
            else if (parsed.command && typeof parsed.command === 'string') {
                commands = [{
                    command: parsed.command,
                    parameters: parsed.parameters || {}
                }];
                explanation = parsed.explanation || 'Single command processed by LLM';
                error = parsed.error || null;
            }
            // Handle error-only responses
            else if (parsed.error) {
                commands = [];
                explanation = 'Request could not be processed';
                error = parsed.error;
            }
            else {
                throw new Error('Invalid response structure: missing commands array or single command');
            }
            
            // Validate each command
            commands.forEach((cmd, index) => {
                if (!cmd.command || typeof cmd.command !== 'string') {
                    throw new Error(`Invalid command at index ${index}: missing command name`);
                }
                if (!cmd.parameters || typeof cmd.parameters !== 'object') {
                    commands[index].parameters = {};
                }
            });
            
            return {
                success: !error,
                commands: commands,
                explanation: explanation,
                error: error
            };
            
        } catch (error) {
            const content = response.choices?.[0]?.message?.content || 'No content';
            const cleanedContent = content ? this.stripCodeBlocks(content) : 'No content';
            
            logger.error(`Failed to parse OpenAI response: ${error.message}`, 'llm');
            logger.debug(`Raw OpenAI content: ${content}`, 'llm');
            logger.debug(`Cleaned content: ${cleanedContent}`, 'llm');
            return {
                success: false,
                commands: [],
                error: `Failed to parse LLM response: ${error.message}`,
                explanation: 'Could not understand the response from the language model'
            };
        }
    }
    
    /**
     * Test API connection
     * 
     * @returns {Promise<void>}
     */
    async testConnection() {
        const testResponse = await this.makeAPIRequest(
            'You are a test assistant.',
            'Respond with just the word "test"'
        );
        
        if (!testResponse.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from OpenAI API');
        }
    }
    
    /**
     * Validate OpenAI configuration
     * 
     * @returns {boolean} True if configuration is valid
     */
    validateConfig() {
        if (!this.apiKey) {
            logger.error('OpenAI API key is missing', 'llm');
            return false;
        }
        
        if (!this.model) {
            logger.error('OpenAI model is not specified', 'llm');
            return false;
        }
        
        return true;
    }
    
    /**
     * Get provider name
     * 
     * @returns {string} Provider name
     */
    getProviderName() {
        return 'openai';
    }
}

module.exports = OpenAIProvider;
