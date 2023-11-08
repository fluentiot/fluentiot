
class VariableConstraints {
    
    constructor(Scenario, variable) {
        this.Scenario = Scenario;
        this.variable = variable;
    }

    is(variableName, targetValue) {
        const currentValue = this.variable.get(variableName);
        return currentValue === targetValue;
    }

}

module.exports = VariableConstraints;
