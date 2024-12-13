/**
 * Check if a string is a valid JSON string
 * 
 * @param {string} str - String to check
 * @returns {boolean} - True if the string is a valid JSON string; false otherwise
 */
function isJSONString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = isJSONString