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

        this.thenHandler = null
        this.errorHandler = null
    }

    run(...args) {
        const [device] = args

        if (device && typeof device === 'object' && device.name) {
            logger.info(`Capability "${this.name}" running for device "${device.name}"`, 'device');
        } else {
            logger.info(`Capability "${this.name}" running`, 'device');
        }

        try {
            this.result = this.callback(...args)
            this.success = true
        }
        catch (err) {
            logger.error([`Capability "${this.name}" failed`, err], 'device')
            this.result = err
            this.success = false
        }

        return this;
    }

    then(callback) {
        if (!this.success) {
            return this
        }
        callback(this.result)
        return this
    }

    catch(callback) {
        if (this.success) {
            return this
        }
        callback(this.result)
        return this
    }

    finally(callback) {
        callback(this.result)
        return this
    }

}

module.exports = Capability