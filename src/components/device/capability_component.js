
class CapabilityComponent {

    init(Fluent) {
        this.capabilities = {};
    }

    add(name, callback) {
        this.capabilities[name] = {
            name,
            callback
        };
        return this.capabilities[name];
    }

    get(name) {
        return this.capabilities[name];
    }

}

module.exports = CapabilityComponent;
