
const Scene = require('./scene');

class SceneComponent {

    init(Fluent) {
        this.Fluent = Fluent;
        this.Event = this.Fluent.component().get('event');

        this.scenes = {};
    }

    add(name, callback) {
        const newScene = new Scene(this.Event, name, callback);
        this.scenes[name] = newScene;
    }

    get(name) {
        const scene = this.scenes[name];
        return scene;
    }
    
}

module.exports = SceneComponent;
