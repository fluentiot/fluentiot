const logger = require('./../../commons/logger')

/**
 * Capability
 *
 * @class
 */
class Capability {

    constructor(parent, name, callback) {
        this.parent = parent
        this.name = name
        this.callback = callback
        this.success = null
        this.result = null
    }

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

    catch(onRejected) {
        if (!this.success) {
            onRejected(this.result);
        }
        return this;
    }

}

module.exports = Capability