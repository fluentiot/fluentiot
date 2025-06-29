const Component = require('./../component')
const logger = require('./../../logger')

const say = require('say')

/**
 * Speech component for text-to-speech functionality
 *
 * @extends Component
 * @class
 */
class SpeechComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.queue = [];
        this.speaking = false;
    }

    /**
     * Say something using text-to-speech
     * 
     * @param {string} message - Message to speak
     * @param {number} speed - Speech speed (default: 0.9)
     * @param {object} options - Additional options for speech
     * @returns {Promise} - Promise that resolves when speech is queued
     */
    say(message, speed = 0.9, options = {}) {
        return new Promise((resolve, reject) => {
            if (!message || typeof message !== 'string') {
                const error = new Error('Message must be a non-empty string');
                logger.error(error.message, 'speech');
                reject(error);
                return;
            }

            this.queue.push({ 
                message, 
                speed, 
                options,
                resolve,
                reject
            });
            
            this._processQueue();
        });
    }

    /**
     * Say something immediately, interrupting current speech
     * 
     * @param {string} message - Message to speak
     * @param {number} speed - Speech speed (default: 0.9)
     * @param {object} options - Additional options for speech
     * @returns {Promise} - Promise that resolves when speech starts
     */
    sayImmediate(message, speed = 0.9, options = {}) {
        // Clear the queue and stop current speech
        this.stop();
        
        return this.say(message, speed, options);
    }

    /**
     * Stop current speech and clear queue
     */
    stop() {
        // Clear the queue
        this.queue.forEach(item => {
            if (item.reject) {
                item.reject(new Error('Speech cancelled'));
            }
        });
        this.queue = [];
        
        // Note: 'say' library doesn't have a direct stop method
        // This will prevent queued items from playing, but won't stop current speech
        this.speaking = false;
        
        logger.info('Speech stopped and queue cleared', 'speech');
    }

    /**
     * Check if the speech system is currently speaking
     * 
     * @returns {boolean} - True if currently speaking
     */
    isSpeaking() {
        return this.speaking;
    }

    /**
     * Get the number of items in the speech queue
     * 
     * @returns {number} - Number of queued speech items
     */
    getQueueLength() {
        return this.queue.length;
    }

    /**
     * Process the speech queue
     * @private
     */
    _processQueue() {
        if (this.queue.length === 0) {
            return;
        }
        
        if (this.speaking) {
            return;
        }
        
        const next = this.queue.shift();
        this._speak(next);
    }

    /**
     * Perform the actual speech
     * 
     * @param {object} speechItem - Speech item with message, speed, options, and callbacks
     * @private
     */
    _speak(speechItem) {
        const { message, speed, options, resolve, reject } = speechItem;
        
        logger.info(`Speaking: "${message}" (speed: ${speed})`, 'speech');

        this.speaking = true;

        // Emit event that speech is starting
        this.emit('speech.start', { message, speed, options });

        say.speak(message, options.voice || null, speed, (err) => {
            this.speaking = false;
            
            if (err) {
                logger.error(`Speech error: ${err.message}`, 'speech');
                this.emit('speech.error', { message, error: err.message });
                if (reject) reject(err);
            } else {
                logger.debug(`Finished speaking: "${message}"`, 'speech');
                this.emit('speech.complete', { message });
                if (resolve) resolve();
            }
            
            // Process next item in queue
            this._processQueue();
        });
    }

    /**
     * Get available voices (platform dependent)
     * 
     * @returns {Promise<Array>} - Promise that resolves to array of available voices
     */
    getAvailableVoices() {
        return new Promise((resolve) => {
            // This is platform dependent and may not be available in all environments
            try {
                say.getInstalledVoices((err, voices) => {
                    if (err) {
                        logger.warn(`Could not get installed voices: ${err.message}`, 'speech');
                        resolve([]);
                    } else {
                        resolve(voices || []);
                    }
                });
            } catch (error) {
                logger.warn(`getInstalledVoices not available: ${error.message}`, 'speech');
                resolve([]);
            }
        });
    }
}

module.exports = SpeechComponent;
