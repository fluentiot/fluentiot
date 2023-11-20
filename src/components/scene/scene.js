
const logger = require('./../../utils/logger');

class Scene {

    constructor(Event, name, callback) {
        this.Event = Event;
        this.name = name;
        this.callback = callback;
    }

    run() {
        logger.info(`Scene "${this.name}" running`, 'scene');
        this.callback();
    }

}

module.exports = Scene;
