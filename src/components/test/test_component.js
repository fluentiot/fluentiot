
class TestComponent {

    init(Fluent) {
        this.Fluent = Fluent;
    }

    constraints(Scenario, constraints) {
        return {
            test: () => {
                return {
                    is: (a, b) => {
                        constraints.push(() => { return a === b; })
                        return Scenario.constraint(constraints)
                    }
                }
            },
        }
    }


}

module.exports = TestComponent;
