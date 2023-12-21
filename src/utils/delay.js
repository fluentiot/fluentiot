
function delay(milliseconds) {
    if(milliseconds < 0) {
        throw new Error('Delay time cannot be negative')
    }
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = delay