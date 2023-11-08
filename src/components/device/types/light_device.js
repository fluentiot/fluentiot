
const Device = require('./../device');

class LightDevice extends Device {

    setup() {
        // Default attributes for light devices
        this.attributes = {
            state: false,
            brightness: 100
        };

        // Default capabilities for light devices
        this.capabilities = {
            turnOn: () => {
                this.updateAttribute('state', true);
            },
            turnOff: () => {
                this.updateAttribute('state', false);
            },
        };
    }
}

module.exports = LightDevice;
