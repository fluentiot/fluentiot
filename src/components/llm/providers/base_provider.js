/**
 * Abstract base class for LLM providers
 * Defines the interface that all LLM providers must implement
 * 
 * @abstract
 * @class
 */
class BaseLLMProvider {
    
    /**
     * Constructor
     * 
     * @param {Object} config - Configuration for the provider
     */
    constructor(config) {
        if (new.target === BaseLLMProvider) {
            throw new Error('Cannot instantiate abstract class BaseLLMProvider.')
        }
        
        this.config = config || {};
        this.isReady = false;
    }
    
    /**
     * Initialize the provider
     * Must be implemented by subclasses
     * 
     * @abstract
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error('initialize() must be implemented by subclasses');
    }
    
    /**
     * Process natural language input and return structured commands
     * Must be implemented by subclasses
     * 
     * @abstract
     * @param {string} input - Natural language input from user
     * @param {Object} systemContext - Current system state and available commands
     * @returns {Promise<Object>} Structured response with commands and explanation
     */
    async processNaturalLanguage(input, systemContext) {
        throw new Error('processNaturalLanguage() must be implemented by subclasses');
    }
    
    /**
     * Check if the provider is ready to process requests
     * 
     * @returns {boolean} True if provider is ready
     */
    isProviderReady() {
        return this.isReady;
    }
    
    /**
     * Validate provider configuration
     * Can be overridden by subclasses for specific validation
     * 
     * @returns {boolean} True if configuration is valid
     */
    validateConfig() {
        return true;
    }
    
    /**
     * Get provider name
     * Must be implemented by subclasses
     * 
     * @abstract
     * @returns {string} Provider name
     */
    getProviderName() {
        throw new Error('getProviderName() must be implemented by subclasses');
    }
}

module.exports = BaseLLMProvider;
