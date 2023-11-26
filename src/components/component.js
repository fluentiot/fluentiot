
class Component {

    constructor(Fluent) {
        this.Fluent = Fluent;
    }

    event() {
        return this.Fluent.component().get('event');
    }

    emit(...args) {
        this.Fluent.component().get('event').emit(...args);
    }

}

module.exports = Component;