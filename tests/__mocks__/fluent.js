class Fluent {
    static component() {
        return {
            get: (name) => {
                if (name === 'event') {
                    const event = new Object()
                    event.emit = (...args) => {}
                    return event
                }
            },
        }
    }
}

module.exports = Fluent
