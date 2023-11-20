

class ExpectComponent {
    init(Fluent) {
        this.Fluent = Fluent;
    }

    constraints(Scenario, constraints) {
        return {
            expect: (a) => {
                return {
                    to: {
                        equal: (b) => {
                            constraints.push(() => a === b);
                            return Scenario.constraint(constraints);
                        },
                        be: {
                            true: () => {
                                constraints.push(() => a === true);
                                return Scenario.constraint(constraints);
                            },
                            false: () => {
                                constraints.push(() => a === false);
                                return Scenario.constraint(constraints);
                            },
                            null: () => {
                                constraints.push(() => a === null);
                                return Scenario.constraint(constraints);
                            },
                            undefined: () => {
                                constraints.push(() => a === undefined);
                                return Scenario.constraint(constraints);
                            },
                        },
                        include: (b) => {
                            constraints.push(() => a.includes(b));
                            return Scenario.constraint(constraints);
                        },
                        have: {
                            lengthOf: (length) => {
                                constraints.push(() => a.length === length);
                                return Scenario.constraint(constraints);
                            },
                            property: (property) => {
                                constraints.push(() => a.hasOwnProperty(property));
                                return Scenario.constraint(constraints);
                            },
                        },
                        a: (type) => {
                            constraints.push(() => typeof a === type);
                            return Scenario.constraint(constraints);
                        },
                        an: (type) => {
                            constraints.push(() => typeof a === type);
                            return Scenario.constraint(constraints);
                        },
                        // Add more Chai-like methods here based on your needs
                    },
                };
            },
        };
    }
}

module.exports = ExpectComponent;
