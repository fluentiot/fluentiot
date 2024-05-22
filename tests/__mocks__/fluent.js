
class Fluent {

    static _component() {
        return {
            get: (name) => {
                if(name === 'event') {
                    const event = new Object();
                    event.emit = (...args) => {};
                    event.on = (...args) => {};
                    return event;
                }
            }
        }
    }

}

Fluent.component = Fluent._component()

module.exports = Fluent;

