import { info, warn, error, debug } from '../utils/logger.js'; // Import logger functions
export class SoundManager {
    constructor(audioContext, assetLoader, settingsManager // Inject SettingsManager
    ) {
        this.currentMusicSource = null;
        this.audioContext = audioContext;
        this.assetLoader = assetLoader;
        this.settingsManager = settingsManager; // Store reference
        // Create gain nodes
        this.masterGainNode = this.audioContext.createGain();
        this.musicGainNode = this.audioContext.createGain();
        this.sfxGainNode = this.audioContext.createGain();
        // --- Set initial gain values DIRECTLY from settings ---
        // Use 'value' setter for immediate effect before listeners are added
        const initialMaster = this.settingsManager.getMasterVolume();
        const initialMusic = this.settingsManager.getMusicVolumeMultiplier();
        const initialSfx = this.settingsManager.getSfxVolumeMultiplier();
        this.masterGainNode.gain.value = initialMaster;
        this.musicGainNode.gain.value = initialMusic;
        this.sfxGainNode.gain.value = initialSfx;
        info(`SoundManager Initial Gains SET TO: Master=${initialMaster.toFixed(2)}, Music=${initialMusic.toFixed(2)}, SFX=${initialSfx.toFixed(2)}`); // Use logger
        // Connect the nodes: Source -> TypeGain -> MasterGain -> Destination
        this.musicGainNode.connect(this.masterGainNode);
        this.sfxGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.audioContext.destination);
        // --- Add listeners AFTER initial values are set ---
        // These will handle future changes via settingsManager.setXxxVolume
        this.settingsManager.addVolumeListener('master', this.updateMasterVolume.bind(this));
        this.settingsManager.addVolumeListener('music', this.updateMusicVolume.bind(this));
        this.settingsManager.addVolumeListener('sfx', this.updateSfxVolume.bind(this));
    }
    // --- Volume Update Methods ---
    updateMasterVolume(value) {
        const targetValue = Math.max(0.0001, value); // Target value (avoid 0 for exponential ramp)
        debug(`SoundManager: Updating Master Gain from ${this.masterGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`); // Use logger (debug)
        this.masterGainNode.gain.exponentialRampToValueAtTime(targetValue, this.audioContext.currentTime + 0.05 // Ramp duration (e.g., 50ms)
        );
    }
    updateMusicVolume(multiplier) {
        const targetValue = Math.max(0.0001, multiplier);
        debug(`SoundManager: Updating Music Gain Multiplier from ${this.musicGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`); // Use logger (debug)
        this.musicGainNode.gain.exponentialRampToValueAtTime(targetValue, this.audioContext.currentTime + 0.05);
    }
    updateSfxVolume(multiplier) {
        const targetValue = Math.max(0.0001, multiplier);
        debug(`SoundManager: Updating SFX Gain Multiplier from ${this.sfxGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`); // Use logger (debug)
        this.sfxGainNode.gain.exponentialRampToValueAtTime(targetValue, this.audioContext.currentTime + 0.05);
    }
    // --- Play Methods ---
    playSound(key, loop = false) {
        // Ensure context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => error("AudioContext resume failed:", e)); // Use logger
        }
        const buffer = this.assetLoader.getAsset(key);
        if (buffer instanceof AudioBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            // Connect to the SFX gain node
            source.connect(this.sfxGainNode);
            source.start(0);
            info(`Playing SFX: ${key}`); // Use logger
            return source;
        }
        else {
            warn(`Sound asset not found or not an AudioBuffer: ${key}`); // Use logger
            return null;
        }
    }
    playMusic(key) {
        // Ensure context is running
        if (this.audioContext.state === 'suspended') {
            info("AudioContext is suspended, attempting resume..."); // Use logger
            this.audioContext.resume().catch(e => error("AudioContext resume failed:", e)); // Use logger
        }
        info(`Attempting to play music: ${key}. AudioContext state: ${this.audioContext.state}`); // Use logger
        this.stopMusic(); // Stop any currently playing music
        const buffer = this.assetLoader.getAsset(key);
        if (buffer instanceof AudioBuffer) {
            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = buffer;
            this.currentMusicSource.loop = true;
            // Connect to the Music gain node
            this.currentMusicSource.connect(this.musicGainNode);
            debug(`SoundManager: Music source created and connected to musicGainNode (current gain: ${this.musicGainNode.gain.value.toFixed(3)}). Master gain: ${this.masterGainNode.gain.value.toFixed(3)}`); // Use logger (debug)
            try {
                this.currentMusicSource.start(0);
                info(`SoundManager: Music '${key}' started.`); // Use logger
            }
            catch (err) { // Use different variable name
                error(`SoundManager: Error starting music source for '${key}':`, err); // Use logger
            }
        }
        else {
            warn(`Music asset not found or not an AudioBuffer: ${key}`); // Use logger
        }
    }
    stopMusic() {
        if (this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
            }
            catch (e) {
                // Ignore errors if already stopped
            }
            this.currentMusicSource.disconnect(); // Disconnect node
            this.currentMusicSource = null;
            info('Music stopped.'); // Use logger
        }
    }
    // Optional: Method to stop all sounds (e.g., on pause)
    stopAllSounds() {
        // This is complex as you need to track all active SFX sources.
        // A simpler approach for pause is to ramp masterGainNode down to 0.
        warn("stopAllSounds() not fully implemented - consider muting master gain instead."); // Use logger
        this.stopMusic();
    }
    // Call this on cleanup
    destroy() {
        // Remove listeners
        this.settingsManager.removeVolumeListener('master', this.updateMasterVolume.bind(this));
        this.settingsManager.removeVolumeListener('music', this.updateMusicVolume.bind(this));
        this.settingsManager.removeVolumeListener('sfx', this.updateSfxVolume.bind(this));
        this.stopAllSounds();
        this.masterGainNode.disconnect();
        this.musicGainNode.disconnect();
        this.sfxGainNode.disconnect();
        info("SoundManager destroyed."); // Use logger
    }
}
