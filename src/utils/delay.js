
/**
 * Delay for a specified amount of time
 * 
 * @param {number} milliseconds - Time to delay in milliseconds
 * @returns {Promise<void>} - Resolves after the delay
 */
function delay(milliseconds) {
    if(milliseconds < 0) {
        throw new Error('Delay time cannot be negative')
    }
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = delay