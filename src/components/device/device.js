
class Device {

    constructor(Event, name) {
        this.Event = Event;
        this.name = name;
        this.attributes = {};
        this.capabilities = {};
    }

    getAttribute(attributeName) {
        return this.attributes[attributeName];
    }

    updateAttribute(name, value) {
        if(this.attributes[name] === value) {
            return;
        }

        this.attributes[name] = value;
        this.Event.emit(`device.${this.name}`, { name, value });
    }

    executeCapability(name) {
        const capability = this.capabilities[name];
        if (capability) {
            capability();
        } else {
            console.error(`Capability '${name}' not found for device.`);
        }
    }

    setupCapabilities() {
        Object.keys(this.capabilities).forEach((capability) => {
            this[capability] = () => this.executeCapability(capability);
        });
    }

}

module.exports = Device;
