class Test {
    constructor() {
        this.lastMethod = null

        this.triggersProxy = new Proxy(
            {},
            {
                get: (_, prop) => {
                    if (prop === 'is' || prop === 'updated') {
                        return function () {
                            console.log(`Overridden value for ${prop}`)
                            return this.triggersProxy // Return the proxy itself for chaining
                        }.bind(this)
                    }
                    return this.triggers()[prop]
                },
            }
        )
    }

    foo() {
        const result1 = this.triggersProxy.variable('hey').is('moo')
        const result2 = this.triggersProxy.variable('hey').updated()

        console.log(result1) // Outputs: undefined
        console.log(result2) // Outputs: undefined
    }

    triggers() {
        return {
            variable: (variableName) => {
                return {
                    is: (variableValue) => {
                        console.log('variable name: ' + variableName)
                        console.log('variable value: ' + variableValue)
                    },
                    updated: () => {
                        console.log('updated')
                    },
                }
            },
        }
    }
}

const test = new Test()
test.foo()
