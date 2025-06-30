const Component = require('./../component');
const logger = require('./../../logger');
const config = require('./../../config');
const OpenAIProvider = require('./providers/openai_provider');
const PromptManager = require('./prompt_manager');

/**
 * LLM component for natural language processing
 * Manages LLM providers and processes natural language commands
 * 
 * @extends Component
 * @class
 */
class LLMComponent extends Component {
    
    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework
     */
    constructor(Fluent) {
        super(Fluent);
        
        this.config = config.get('llm') || {};
        this.enabled = this.config.enabled || false;
        this.provider = null;
        this.fallbackToExact = this.config.fallbackToExact !== false; // Default true
        this.promptManager = new PromptManager();
        this.history = [];
        this.maxHistory = this.config.maxHistory || 10;
        
        // Timeout for LLM requests (10 seconds)
        this.requestTimeout = 10000;
    }
    
    /**
     * After Fluent is loaded, initialize the LLM provider
     */
    async afterLoad() {
        if (!this.enabled) {
            logger.info('LLM component is disabled', 'llm');
            return;
        }
        
        try {
            await this.initializeProvider();
            logger.info('LLM component loaded successfully', 'llm');
        } catch (error) {
            logger.error(`LLM component initialization failed: ${error.message}`, 'llm');
            // Don't throw - allow framework to continue without LLM
        }
    }
    
    /**
     * Initialize the configured LLM provider
     * 
     * @returns {Promise<void>}
     */
    async initializeProvider() {
        const providerName = this.config.provider || 'openai';
        
        switch (providerName.toLowerCase()) {
            case 'openai':
                if (!this.config.openai) {
                    throw new Error('OpenAI configuration missing');
                }
                this.provider = new OpenAIProvider(this.config.openai);
                break;
            
            default:
                throw new Error(`Unknown LLM provider: ${providerName}`);
        }
        
        await this.provider.initialize();
        logger.info(`LLM provider "${providerName}" initialized`, 'llm');
    }
    
    /**
     * Process natural language input and convert to commands
     * 
     * @param {string} input - Natural language input
     * @returns {Promise<Object>} Processing result with commands and explanation
     */    
    async processNaturalLanguage(input) {
        if (!this.enabled) {
            return {
                success: false,
                error: 'LLM processing is disabled',
                explanation: 'Natural language processing is not enabled'
            };
        }

        if (!this.provider || !this.provider.isProviderReady()) {
            return {
                success: false,
                error: 'LLM provider not available',
                explanation: 'Language model provider is not ready'
            };
        }

        try {
            logger.info(`Processing natural language input: "${input}"`, 'llm');
            
            // Build system context
            const systemContext = await this.buildSystemContext();
            logger.debug(`System context built with ${Object.keys(systemContext.devices).length} devices, ${Object.keys(systemContext.commands).length} commands`, 'llm');
            
            // Add current input to history
            this.addToHistory({ role: 'user', content: input });

            // Process with timeout
            const result = await Promise.race([
                this.provider.processNaturalLanguage(input, systemContext, this.history),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('LLM request timeout')), this.requestTimeout)
                )
            ]);
            
            if (result.success) {
                // Add LLM response to history
                const assistantResponse = JSON.stringify(result.commands);
                this.addToHistory({ role: 'assistant', content: assistantResponse });

                logger.info(`LLM processing successful: ${result.explanation}`, 'llm');
                logger.debug(`Generated ${result.commands.length} commands: ${JSON.stringify(result.commands, null, 2)}`, 'llm');
                
                // Execute the returned commands
                return await this.executeGeneratedCommands(result);
            } else {
                logger.warn(`LLM processing failed: ${result.error}`, 'llm');
                return result;
            }
            
        } catch (error) {
            logger.error(`LLM processing error: ${error.message}`, 'llm');
            return {
                success: false,
                error: error.message,
                explanation: 'Failed to process natural language input'
            };
        }
    }
    
    /**
     * Build system context for the LLM prompt
     * 
     * @returns {Promise<Object>} System context object
     */
    async buildSystemContext() {
        const context = {
            commands: {},
            devices: {},
            scenes: {},
            rooms: {}
        };
        
        try {
            // Get all available commands
            context.commands = this.Fluent._command().getAllCommands();
            
            // Get device information
            const deviceComponent = this.getComponent('device');
            if (deviceComponent && deviceComponent.devices) {
                context.devices = this.sanitizeDevices(deviceComponent.devices);
            }
            
            // Get scene information
            const sceneComponent = this.getComponent('scene');
            if (sceneComponent && typeof sceneComponent.list === 'function') {
                const sceneResult = sceneComponent.list();
                if (sceneResult && typeof sceneResult === 'object') {
                    context.scenes = sceneResult;
                }
            }
            
            // Get room information
            const roomComponent = this.getComponent('room');
            if (roomComponent && roomComponent.rooms) {
                context.rooms = roomComponent.rooms;
            }
            
        } catch (error) {
            logger.warn(`Error building system context: ${error.message}`, 'llm');
        }
        
        return context;
    }
    
    /**
     * Sanitize device data for LLM context (remove circular references)
     * 
     * @param {Object} devices - Raw device data
     * @returns {Object} Sanitized device data
     */
    sanitizeDevices(devices) {
        const sanitized = {};
        
        Object.entries(devices).forEach(([deviceName, device]) => {
            sanitized[deviceName] = {
                name: device.name || deviceName,
                attributes: device.attributes || {},
                capabilities: Object.keys(device.capabilities || {}),
                type: device.type || 'unknown'
            };
        });
        
        return sanitized;
    }

    /**
     * Add a message to the history, ensuring it doesn't exceed maxHistory
     * 
     * @param {Object} message - Message to add to history
     */
    addToHistory(message) {
        this.history.push(message);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    /**
     * Execute commands generated by the LLM
     * 
     * @param {Object} result - LLM result with commands
     * @returns {Promise<Object>} Execution result
     */
    async executeGeneratedCommands(result) {
        const { commands, explanation } = result;
        const executionResults = [];
        
        try {
            // Validate and execute each command
            for (const cmdData of commands) {
                const executionResult = await this.executeCommand(cmdData);
                executionResults.push(executionResult);
                
                // If any command fails, log but continue with others
                if (!executionResult.success) {
                    logger.warn(`Command execution failed: ${executionResult.error}`, 'llm');
                }
            }
            
            return {
                success: true,
                explanation: explanation,
                executedCommands: executionResults,
                llmGenerated: true
            };
            
        } catch (error) {
            logger.error(`Command execution error: ${error.message}`, 'llm');
            return {
                success: false,
                error: error.message,
                explanation: 'Failed to execute generated commands',
                executedCommands: executionResults
            };
        }
    }
    
    /**
     * Execute a single command
     * 
     * @param {Object} cmdData - Command data with command name and parameters
     * @returns {Promise<Object>} Execution result
     */
    async executeCommand(cmdData) {
        try {
            const { command, parameters } = cmdData;
            
            // Validate command exists
            const allCommands = this.Fluent._command().getAllCommands();
            if (!allCommands[command]) {
                return {
                    success: false,
                    error: `Unknown command: ${command}`,
                    command: command
                };
            }
            
            // Execute through command handler (simulate SocketIO command execution)
            const socketHandler = this.getComponent('socketio');
            if (socketHandler && socketHandler.commandHandler) {
                return new Promise((resolve) => {
                    socketHandler.commandHandler.execute(
                        { command, parameters },
                        (result) => {
                            resolve({
                                success: result.success,
                                data: result.data,
                                error: result.error,
                                command: command
                            });
                        }
                    );
                });
            } else {
                // Fallback: execute directly
                const commandHandler = allCommands[command];
                let commandResult;
                
                if (typeof commandHandler === 'function') {
                    commandResult = await commandHandler(parameters);
                } else if (commandHandler && typeof commandHandler.handler === 'function') {
                    commandResult = await commandHandler.handler(parameters);
                } else {
                    throw new Error(`Command "${command}" has no valid handler`);
                }
                
                return {
                    success: true,
                    data: commandResult,
                    command: command
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: cmdData.command
            };
        }
    }
    
    /**
     * Check if LLM component is enabled
     * 
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Get LLM component status
     * 
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            available: this.provider && this.provider.isProviderReady(),
            provider: this.provider ? this.provider.getProviderName() : null,
            fallbackToExact: this.fallbackToExact,
            status: this.getStatusMessage()
        };
    }
    
    /**
     * Get status message
     * 
     * @returns {string} Status message
     */
    getStatusMessage() {
        if (!this.enabled) {
            return 'LLM processing is disabled';
        }
        
        if (!this.provider) {
            return 'No LLM provider configured';
        }
        
        if (!this.provider.isProviderReady()) {
            return 'LLM provider is not ready';
        }
        
        return 'LLM component is ready';
    }
}

module.exports = LLMComponent;
