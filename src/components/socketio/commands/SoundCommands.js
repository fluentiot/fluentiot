const BaseCommand = require('./BaseCommand');

/**
 * Sound commands
 */
class SoundCommands extends BaseCommand {
    getCommands() {
        return {
            'sound.play': this.playSound.bind(this),
            'sound.say': this.sayText.bind(this)
        };
    }

    getCommandSuggestions() {
        return [
            'play sound [name]',
            'say [text]'
        ];
    }

    playSound(params) {
        try {
            const { soundName } = params;
            const soundComponent = this.Fluent._component().get('sound');
            if (soundComponent && soundComponent.play) {
                soundComponent.play(soundName);
                return { message: `Playing sound: ${soundName}` };
            }
            return { error: 'Sound component not available' };
        } catch (error) {
            return this.handleError('playing sound', error);
        }
    }

    sayText(params) {
        try {
            const { text } = params;
            const soundComponent = this.Fluent._component().get('sound');
            if (soundComponent && soundComponent.say) {
                soundComponent.say(text);
                return { message: `Speaking: ${text}` };
            }
            return { error: 'Sound component not available' };
        } catch (error) {
            return this.handleError('speaking text', error);
        }
    }
}

module.exports = SoundCommands;
