const Command = require('../command');

/**
 * Media-related commands for audio playback and text-to-speech functionality
 */
class MediaCommands extends Command {
    
    getComponentName() {
        return 'media';
    }

    getCommands() {
        return {
            'media.play': {
                handler: this.playSound.bind(this),
                description: 'Play a specific sound file by name from the available sound directories',
                parameters: [
                    { name: 'soundName', type: 'string', required: true, description: 'The name of the sound file to play (with or without extension)' }
                ]
            },
            'media.sounds': {
                handler: this.listSounds.bind(this),
                description: 'List all available sound files that can be played',
                parameters: []
            },
            'media.refresh': {
                handler: this.refreshSounds.bind(this),
                description: 'Refresh the sound file index to pick up newly added files',
                parameters: []
            },
            'media.say': {
                handler: this.sayText.bind(this),
                description: 'Convert text to speech and play it through the audio system',
                parameters: [
                    { name: 'text', type: 'string', required: true, description: 'The text to convert to speech and play' },
                    { name: 'speed', type: 'number', required: false, description: 'Speech speed (default: 0.9, range: 0.1-2.0)' },
                    { name: 'voice', type: 'string', required: false, description: 'Voice to use (platform dependent)' }
                ]
            },
            'media.say.immediate': {
                handler: this.sayTextImmediate.bind(this),
                description: 'Say text immediately, interrupting any current speech',
                parameters: [
                    { name: 'text', type: 'string', required: true, description: 'The text to convert to speech and play immediately' },
                    { name: 'speed', type: 'number', required: false, description: 'Speech speed (default: 0.9, range: 0.1-2.0)' },
                    { name: 'voice', type: 'string', required: false, description: 'Voice to use (platform dependent)' }
                ]
            },
            'media.speech.stop': {
                handler: this.stopSpeech.bind(this),
                description: 'Stop current speech and clear the speech queue',
                parameters: []
            },
            'media.speech.status': {
                handler: this.getSpeechStatus.bind(this),
                description: 'Get current speech status including queue length and speaking state',
                parameters: []
            },
            'media.voices': {
                handler: this.getAvailableVoices.bind(this),
                description: 'Get list of available voices for text-to-speech (platform dependent)',
                parameters: []
            }
        };
    }

    getCommandSuggestions() {
        return [
            'play sound [name]',
            'list available sounds',
            'refresh sound files',
            'say [text]',
            'say [text] with speed [0.1-2.0]',
            'say immediately [text]',
            'stop speech',
            'get speech status',
            'list available voices'
        ];
    }

    /**
     * Play a sound file
     */
    async playSound(params) {
        try {
            const { soundName } = params;
            
            if (!soundName) {
                return { error: 'Sound name is required' };
            }

            const audioComponent = this.getComponent('audio');
            if (!audioComponent) {
                return { error: 'Audio component not available' };
            }

            const result = audioComponent.play(soundName);
            
            if (result) {
                this.logSuccess(`Playing sound: ${soundName}`);
                return { 
                    success: true, 
                    message: `Playing sound: ${soundName}`,
                    soundName: soundName
                };
            } else {
                return { 
                    error: `Sound "${soundName}" not found`,
                    availableSounds: audioComponent.getAvailableSounds()
                };
            }
        } catch (error) {
            return this.handleError('playing sound', error);
        }
    }

    /**
     * List available sounds
     */
    async listSounds(params) {
        try {
            const audioComponent = this.getComponent('audio');
            if (!audioComponent) {
                return { error: 'Audio component not available' };
            }

            const sounds = audioComponent.getAvailableSounds();
            const directories = audioComponent.getSoundDirectories();
            
            this.logSuccess(`Found ${sounds.length} available sounds`);
            
            return {
                success: true,
                sounds: sounds,
                soundDirectories: directories,
                count: sounds.length
            };
        } catch (error) {
            return this.handleError('listing sounds', error);
        }
    }

    /**
     * Refresh sound index
     */
    async refreshSounds(params) {
        try {
            const audioComponent = this.getComponent('audio');
            if (!audioComponent) {
                return { error: 'Audio component not available' };
            }

            audioComponent.refreshSoundIndex();
            const sounds = audioComponent.getAvailableSounds();
            
            this.logSuccess(`Sound index refreshed, found ${sounds.length} sounds`);
            
            return {
                success: true,
                message: 'Sound index refreshed',
                soundCount: sounds.length
            };
        } catch (error) {
            return this.handleError('refreshing sound index', error);
        }
    }

    /**
     * Convert text to speech
     */
    async sayText(params) {
        try {
            const { text, speed = 0.9, voice } = params;
            
            if (!text) {
                return { error: 'Text is required' };
            }

            const speechComponent = this.getComponent('speech');
            if (!speechComponent) {
                return { error: 'Speech component not available' };
            }

            const options = {};
            if (voice) {
                options.voice = voice;
            }

            await speechComponent.say(text, speed, options);
            
            this.logSuccess(`Queued text for speech: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            
            return {
                success: true,
                message: 'Text queued for speech',
                text: text,
                speed: speed,
                queueLength: speechComponent.getQueueLength()
            };
        } catch (error) {
            return this.handleError('converting text to speech', error);
        }
    }

    /**
     * Convert text to speech immediately
     */
    async sayTextImmediate(params) {
        try {
            const { text, speed = 0.9, voice } = params;
            
            if (!text) {
                return { error: 'Text is required' };
            }

            const speechComponent = this.getComponent('speech');
            if (!speechComponent) {
                return { error: 'Speech component not available' };
            }

            const options = {};
            if (voice) {
                options.voice = voice;
            }

            await speechComponent.sayImmediate(text, speed, options);
            
            this.logSuccess(`Speaking immediately: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            
            return {
                success: true,
                message: 'Speaking text immediately',
                text: text,
                speed: speed
            };
        } catch (error) {
            return this.handleError('speaking text immediately', error);
        }
    }

    /**
     * Stop current speech
     */
    async stopSpeech(params) {
        try {
            const speechComponent = this.getComponent('speech');
            if (!speechComponent) {
                return { error: 'Speech component not available' };
            }

            speechComponent.stop();
            
            this.logSuccess('Speech stopped and queue cleared');
            
            return {
                success: true,
                message: 'Speech stopped and queue cleared'
            };
        } catch (error) {
            return this.handleError('stopping speech', error);
        }
    }

    /**
     * Get speech status
     */
    async getSpeechStatus(params) {
        try {
            const speechComponent = this.getComponent('speech');
            if (!speechComponent) {
                return { error: 'Speech component not available' };
            }

            const status = {
                speaking: speechComponent.isSpeaking(),
                queueLength: speechComponent.getQueueLength()
            };
            
            this.logSuccess(`Speech status: speaking=${status.speaking}, queue=${status.queueLength}`);
            
            return {
                success: true,
                status: status
            };
        } catch (error) {
            return this.handleError('getting speech status', error);
        }
    }

    /**
     * Get available voices
     */
    async getAvailableVoices(params) {
        try {
            const speechComponent = this.getComponent('speech');
            if (!speechComponent) {
                return { error: 'Speech component not available' };
            }

            const voices = await speechComponent.getAvailableVoices();
            
            this.logSuccess(`Found ${voices.length} available voices`);
            
            return {
                success: true,
                voices: voices,
                count: voices.length
            };
        } catch (error) {
            return this.handleError('getting available voices', error);
        }
    }
}

module.exports = MediaCommands;
