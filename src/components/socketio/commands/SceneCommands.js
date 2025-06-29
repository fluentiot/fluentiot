const BaseCommand = require('./BaseCommand');

/**
 * Scene commands
 */
class SceneCommands extends BaseCommand {
    getCommands() {
        return {
            'scene.list': this.listScenes.bind(this),
            'scene.activate': this.activateScene.bind(this)
        };
    }

    getCommandSuggestions() {
        return [
            'activate scene [name]'
        ];
    }

    listScenes(params) {
        try {
            const sceneComponent = this.Fluent._component().get('scene');
            if (sceneComponent) {
                const scenes = sceneComponent.scenes || {};
                const sceneCount = Object.keys(scenes).length;
                this.logSuccess(`Scene component found, scenes count: ${sceneCount}`);
                
                // Create a safe, serializable version of the scenes
                const safeScenes = {};
                Object.keys(scenes).forEach(sceneName => {
                    const scene = scenes[sceneName];
                    safeScenes[sceneName] = {
                        name: scene.name || sceneName,
                        available: true,
                        type: 'scene'
                    };
                });
                
                this.logSuccess(`Returning ${Object.keys(safeScenes).length} safe scenes`);
                return safeScenes;
            }
            this.logSuccess('Scene component not available');
            return {};
        } catch (error) {
            return this.handleError('listing scenes', error);
        }
    }

    activateScene(params) {
        try {
            const { sceneName } = params;
            const sceneComponent = this.Fluent._component().get('scene');
            if (sceneComponent && sceneComponent.run) {
                const result = sceneComponent.run(sceneName);
                if (result !== false) {
                    return { message: `Scene '${sceneName}' activated` };
                } else {
                    return { error: `Scene '${sceneName}' not found or failed to run` };
                }
            }
            return { error: 'Scene component not available' };
        } catch (error) {
            return this.handleError('activating scene', error);
        }
    }
}

module.exports = SceneCommands;
