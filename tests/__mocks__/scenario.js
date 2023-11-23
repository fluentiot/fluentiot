// tests/__mocks__/scenario.js
class Scenario {
    constructor(Fluent, description) {
        this.Fluent = Fluent;
        this.description = description;
        
        this.testMode = false;
        this.runnable = true;
    }
}
  
module.exports = Scenario;
