const logger = require('./../../utils/logger');

class Scene {

    constructor(parent, name, callback) {
        this.parent = parent;
        this.name = name;
        this.callback = callback;
    }

    run() {
        logger.info(`Scene "${this.name}" running`, 'scene');
        this.parent.emit('scene.run', this.name);
        this.callback();
    }

}

module.exports = Scene;
