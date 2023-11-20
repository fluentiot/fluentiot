// src/devices/device_manager.js
const path = require('path');

const DeviceTriggers = require('./device_triggers');

class DeviceComponent {
    
    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');

        this.devices = {};
        this.typesDirectory = path.join(__dirname, 'types');
    }

    add(name, attributes) {
        if(this.devices[name]) {
            throw new Error(`Device with ${name} already exists`);
        }

        if(!attributes) {
            attributes = {}
        }

        const DeviceType = require('./device');
        this.devices[name] = new DeviceType(this.Event, name);
            
        // Loop through attributes and set them
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                const value = attributes[key];
                this.devices[name].setAttribute(key, value);
            }
        }

        return this.devices[name];
    }

    get(name) {
        if (!this.devices[name]) {
            throw new Error(`Device '${name}' not found.`);
        }
        return this.devices[name];
    }

    findByAttribute(attribute, value) {
        for (const deviceName in this.devices) {
            if (this.devices.hasOwnProperty(deviceName)) {
                const device = this.devices[deviceName];
                const attributeValue = device.getAttribute(attribute);
    
                if (attributeValue === value) {
                    return device;
                }
            }
        }

    
        return null; // Return null if no device with the specified attribute and value is found
    }

    loadDeviceType(type) {
        const typeFilePath = path.join(this.typesDirectory, `${type}_device.js`);

        try {
            return require(typeFilePath);
        } catch (error) {
            throw new Error(`Device type '${type}' not found or has an error.`);
        }
    }

    triggers(Scenario) {
        return {
            device: (name) => {
                return {
                    is: (attributeName) => { 
                        const device = this.get(name);
                        new DeviceTriggers(Scenario, this.Event).is(device, attributeName, true);
                        return Scenario.triggers;
                    },
                    isNot: (attributeName) => { 
                        const device = this.get(name);
                        new DeviceTriggers(Scenario, this.Event).is(device, attributeName, false);
                        return Scenario.triggers;
                    },
                    attribute: (attributeName) => {
                        return {
                            is: (attributeValue) => {
                                const device = this.get(name);
                                new DeviceTriggers(Scenario, this.Event).is(device, attributeName, attributeValue);
                                return Scenario.triggers;
                            },
                            isNot: (attributeValue) => {
                                const device = this.get(name);
                                new DeviceTriggers(Scenario, this.Event).is(device, attributeName, attributeValue);
                                return Scenario.triggers;
                            }
                        }
                    }
                };
            },
        }
    }

}

module.exports = DeviceComponent;
