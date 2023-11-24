
const { capability, logger } = require('./../../../index.js');

class Device {

    constructor(Event, name) {
        this.Event = Event;
        this.name = name;
        this.attributes = {};
        this.capabilities = {};
    }

    attribute() {
        return {
            get: (attributeName) => {
                return this.attributes[attributeName];
            }
        }
    }

    getAttribute(attributeName) {
        return this.attributes[attributeName];
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    updateAttribute(name, value) {
        // if(this.attributes[name] === value) {
        //     return;
        // }

        this.attributes[name] = value;
        logger.debug(`${this.name} attribute ${name} set to "${value}"`,'device');

        this.Event.emit(`device.${this.name}`, { name, value });

    }

    capability() {
        return {
            add: (method, callback) => {
                //Capability passed
                if(typeof method === 'object') {
                    //Passed with an existing capability object
                    const _capability = method;
                    callback = _capability.callback;
                    method = _capability.name;
                }
                else if(method.startsWith('@')) {
                    //Passed with just the name
                    if(callback) {
                        throw new Error(`When using a named capability do not define the method`);
                    }
                    const _capability = capability.get(method.substring(1));
                    callback = _capability.callback;
                    method = _capability.name;
                }

                this.capabilities[method] = callback;
                this[method] = (...args) => this.executeCapability(method, ...args);
            }
        }
    }

    executeCapability(method, ...args) {
        const capability = this.capabilities[method];
        if (capability) {
            capability(this, ...args);
        } else {
            console.error(`Capability '${method}' not found for device.`);
        }
    }

}

module.exports = Device;
