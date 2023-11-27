
class Component {

    constructor(Fluent) {
        this.Fluent = Fluent;
        this._event = null;
    }

    event() {
        if(!this._event) {
            this._event = this.Fluent.component().get('event');
        }
        return this._event;
    }

    emit(...args) {
        this.event().emit(...args);
    }

}

module.exports = Component;