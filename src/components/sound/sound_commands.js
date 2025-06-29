const Command = require('../command');

/**
 * Sound-related commands (deprecated - use media commands instead)
 * This provides backward compatibility by delegating to media commands
 */
class SoundCommands extends Command {
    
    getComponentName() {
        return 'sound';
    }

    getCommands() {
        return {
            'sound.play': {
                handler: this.playSound.bind(this),
                description: 'Play a specific sound file by name (deprecated - use media.play)',
                parameters: [
                    { name: 'soundName', type: 'string', required: true, description: 'The name of the sound file to play' }
                ]
            },
            'sound.say': {
                handler: this.sayText.bind(this),
                description: 'Convert text to speech (deprecated - use media.say)',
                parameters: [
                    { name: 'text', type: 'string', required: true, description: 'The text to convert to speech and play' }
                ]
            }
        };
    }

    getCommandSuggestions() {
        return [
            'play sound [name] (deprecated)',
            'say [text] (deprecated)'
        ];
    }

    async playSound(params) {
        this.logWarn('sound.play command is deprecated. Use media.play instead.');
        
        try {
            const mediaCommands = this.Fluent._command().get('media', 'media');
            if (mediaCommands && typeof mediaCommands.playSound === 'function') {
                return await mediaCommands.playSound(params);
            }
            
            return { error: 'Media commands not available' };
        } catch (error) {
            return this.handleError('playing sound (deprecated)', error);
        }
    }

    async sayText(params) {
        this.logWarn('sound.say command is deprecated. Use media.say instead.');
        
        try {
            const mediaCommands = this.Fluent._command().get('media', 'media');
            if (mediaCommands && typeof mediaCommands.sayText === 'function') {
                return await mediaCommands.sayText(params);
            }
            
            return { error: 'Media commands not available' };
        } catch (error) {
            return this.handleError('speaking text (deprecated)', error);
        }
    }
}

module.exports = SoundCommands;
