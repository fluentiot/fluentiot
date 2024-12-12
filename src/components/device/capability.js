const logger = require('./../../logger')

/**
 * Capability
 * 
 * @class
 */
class Capability {

    /**
     * Represents a capability that can be run on a device
     * 
     * @param {object} parent - The parent object to which this capability belongs.
     * @param {string} name - The name of the capability.
     * @param {function} callback - The function to run when the capability is called.
     */
    constructor(parent, name, callback) {
        this.parent = parent
        this.name = name
        this.callback = callback
        this.success = null
        this.result = null
    }

    /**
     * Run the capability
     * 
     * @param  {...any} args - Arguments to pass to the capability
     * @returns {Promise} - The result of the capability
     * @throws Will throw an error if the capability fails
     * @example
     * capability.run(device)
     * .then(result => {
     *    console.log(result)
     * })
     * .catch(err => {
     *   console.error(err)
     * })
     */
    async run(...args) {
        const [device] = args
        if (device && typeof device === 'object' && device.name) {
            logger.info(`Capability "${this.name}" running for device "${device.name}"`, 'device');
        } else {
            logger.info(`Capability "${this.name}" running`, 'device');
        }

        try {
            this.result = await this.callback(...args)
            this.success = true
            return this.result
        }
        catch (err) {
            logger.error([`Capability "${this.name}" failed`, err], 'device')
            this.result = err
            this.success = false
            throw err
        }
    }

    /**
     * If the capability throws an error, run the onRejected function
     * 
     * @param {function} onRejected - The function to run if the capability fails
     * @returns {Capability} - The capability object
     */
    catch(onRejected) {
        if (!this.success) {
            onRejected(this.result);
        }
        return this;
    }

}

module.exports = Capability