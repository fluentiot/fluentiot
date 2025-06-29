const Component = require('./../component')
const logger = require('./../../logger')
const config = require('./../../config')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')

const player = require('play-sound')(opts = {})

/**
 * Audio component for playing sound files
 *
 * @extends Component
 * @class
 */
class AudioComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent);
        this.soundDirectories = [];
        this.availableSounds = new Map();
        this._scanSoundDirectories();
    }

    /**
     * Scan and index sound directories
     * @private
     */
    _scanSoundDirectories() {
        // Get user-defined sound directories from config (highest priority)
        const mediaConfig = config.get('media') || {};
        const userSoundDirs = mediaConfig.soundDirectories || [];
        
        // Add user directories first (they have priority)
        userSoundDirs.forEach(dir => {
            if (path.isAbsolute(dir)) {
                this.soundDirectories.push(dir);
            } else {
                // Relative to project root
                this.soundDirectories.push(path.join(appRoot.path, dir));
            }
        });

        // Add system sound directory (lower priority)
        const systemSoundsDir = path.join(__dirname, '../../../assets/sounds');
        this.soundDirectories.push(systemSoundsDir);

        // Scan all directories for sound files
        this._indexSoundFiles();
        
        logger.info(`Audio component initialized with ${this.soundDirectories.length} sound directories`, 'audio');
        logger.debug(`Found ${this.availableSounds.size} sound files`, 'audio');
    }

    /**
     * Index all sound files from all directories
     * @private
     */
    _indexSoundFiles() {
        this.availableSounds.clear();
        
        // Process directories in reverse order so higher priority directories overwrite lower ones
        [...this.soundDirectories].reverse().forEach((dir, index) => {
            if (!fs.existsSync(dir)) {
                logger.warn(`Sound directory does not exist: ${dir}`, 'audio');
                return;
            }

            try {
                const files = fs.readdirSync(dir);
                const soundFiles = files.filter(file => 
                    /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file)
                );

                soundFiles.forEach(file => {
                    const nameWithoutExt = path.parse(file).name;
                    const fullPath = path.join(dir, file);
                    
                    // Store with both the name with and without extension
                    this.availableSounds.set(nameWithoutExt, fullPath);
                    this.availableSounds.set(file, fullPath);
                });

                logger.debug(`Scanned ${soundFiles.length} sound files from ${dir}`, 'audio');
            } catch (error) {
                logger.error(`Error scanning sound directory ${dir}: ${error.message}`, 'audio');
            }
        });
    }

    /**
     * Play a sound file
     * 
     * @param {string} soundName - Name of the sound file (with or without extension)
     * @returns {boolean} - True if sound was found and attempted to play, false otherwise
     */
    play(soundName) {
        if (!soundName) {
            logger.error('No sound name provided', 'audio');
            return false;
        }

        // First try exact match
        let soundPath = this.availableSounds.get(soundName);
        
        // If not found and no extension provided, try with .mp3 extension
        if (!soundPath && !path.extname(soundName)) {
            soundPath = this.availableSounds.get(soundName + '.mp3');
        }

        if (!soundPath) {
            logger.error(`Sound file "${soundName}" not found in any sound directory`, 'audio');
            logger.debug(`Available sounds: ${Array.from(this.availableSounds.keys()).join(', ')}`, 'audio');
            return false;
        }

        logger.info(`Playing "${soundName}" from ${soundPath}`, 'audio');

        player.play(soundPath, function(err) {
            if (err) {
                logger.error(`Error playing sound "${soundName}": ${err.message}`, 'audio');
            }
        });

        return true;
    }

    /**
     * Get list of available sounds
     * 
     * @returns {Array} - Array of available sound names
     */
    getAvailableSounds() {
        const uniqueSounds = new Set();
        
        this.availableSounds.forEach((filePath, name) => {
            // Only add names without extensions to avoid duplicates
            if (!path.extname(name)) {
                uniqueSounds.add(name);
            }
        });
        
        return Array.from(uniqueSounds).sort();
    }

    /**
     * Refresh the sound index (useful when files are added/removed)
     */
    refreshSoundIndex() {
        logger.info('Refreshing sound index...', 'audio');
        this._indexSoundFiles();
    }

    /**
     * Get sound directories configuration
     * 
     * @returns {Array} - Array of sound directory paths
     */
    getSoundDirectories() {
        return [...this.soundDirectories];
    }
}

module.exports = AudioComponent;
