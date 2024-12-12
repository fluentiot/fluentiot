const logger = require('./../../logger');

/**
 * Manages queuing and sending of Tuya device commands
 */
class TuyaQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 2000; // 2 seconds
    }

    /**
     * Add command to queue
     * @param {object} command - Command object with send function
     */
    add(command) {
        command.retries = 0;
        this.queue.push(command);
        
        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Process queued commands
     */
    async process() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const command = this.queue[0];

            try {
                await command.send(command);
                this.queue.shift(); // Remove successfully sent command
            } catch (error) {
                await this._handleError(command, error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Handle command errors and retry if appropriate
     * @private
     */
    async _handleError(command, error) {
        command.retries++;
        logger.error(`Failed to send command to device ${command.id}. Attempt ${command.retries} of ${this.MAX_RETRIES}`, 'tuya queue');

        if (command.retries >= this.MAX_RETRIES) {
            logger.error(`Max retries reached for command to device ${command.id}`, 'tuya queue');
            this.queue.shift(); // Remove failed command
            return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
    }
}

module.exports = TuyaQueue;