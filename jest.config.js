/** @type {import('jest').Config} */
const config = {
    verbose: false,
    testMatch: ["**/tests/**/*.test.js"],
    fakeTimers: {
        "enableGlobally": true,
        "legacyFakeTimers": false
    }
}
  
module.exports = config
