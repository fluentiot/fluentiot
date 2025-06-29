const Command = require('../command');

/**
 * Scene-related commands for activating and managing predefined device configurations
 */
class SceneCommands extends Command {
    
    getComponentName() {
        return 'scene';
    }

    getCommands() {
        return {
            'scene.list': {
                handler: this.listScenes.bind(this),
                description: 'List all available scenes that can be activated to control multiple devices',
                parameters: []
            },
            'scene.activate': {
                handler: this.activateScene.bind(this),
                description: 'Activate a specific scene to execute predefined device actions and settings',
                parameters: [
                    { name: 'sceneName', type: 'string', required: true, description: 'The name of the scene to activate' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'activate scene [name]',
            'list all scenes',
            'run scene [name]'
        ];
    }

    listScenes(params) {
        try {
            const sceneComponent = this.getComponent('scene');
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
            const sceneComponent = this.getComponent('scene');
            if (sceneComponent && sceneComponent.run) {
                const result = sceneComponent.run(sceneName);
                if (result !== false) {
                    this.logSuccess(`Scene '${sceneName}' activated successfully`);
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
