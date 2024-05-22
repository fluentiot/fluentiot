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

        this.promise = this.run()
    }

    run(...args) {
        return new Promise(async (resolve) => {
            // Logging
            const [device] = args
            if (device && typeof device === 'object' && device.name) {
                logger.info(`Capability "${this.name}" running for device "${device.name}"`, 'device');
            } else {
                logger.info(`Capability "${this.name}" running`, 'device');
            }

            try {
                this.result = await this.callback(...args)
                this.success = true
            }
            catch (err) {
                console.log('no')
                logger.error([`Capability "${this.name}" failed`, err], 'device')
                this.result = err
                this.success = false
            }

            resolve(this)
        })
    }

    catch(onRejected) {
        console.log('aaa')
        return this.promise.then(() => {
            if (!this.success) {
                onRejected(this.result);
            }
            return this;
        });
    }

    // async thens(callback) {
    //     if (!this.success) {
    //         return this
    //     }
    //     await callback(this.result)
    //     return this
    // }

    // async catch(callback) {
    //     console.log('catch')
    //     if (this.success) {
    //         return this
    //     }
    //     await callback(this.result)
    //     return this
    // }

    // async finally(callback) {
    //     await callback(this.result)
    //     return this
    // }

}

module.exports = Capability