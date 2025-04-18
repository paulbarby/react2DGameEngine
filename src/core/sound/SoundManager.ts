import { AssetLoader } from '../assets/AssetLoader.js';
import { SettingsManager } from '../settings/SettingsManager.js'; // Import SettingsManager

export class SoundManager {
    private audioContext: AudioContext;
    private assetLoader: AssetLoader;
    private settingsManager: SettingsManager; // Add SettingsManager
    private masterGainNode: GainNode; // Master gain control
    private musicGainNode: GainNode; // Music-specific gain
    private sfxGainNode: GainNode;   // SFX-specific gain
    private currentMusicSource: AudioBufferSourceNode | null = null;

    constructor(
        audioContext: AudioContext,
        assetLoader: AssetLoader,
        settingsManager: SettingsManager // Inject SettingsManager
    ) {
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

        console.log(`SoundManager Initial Gains SET TO: Master=${initialMaster.toFixed(2)}, Music=${initialMusic.toFixed(2)}, SFX=${initialSfx.toFixed(2)}`);

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
    private updateMasterVolume(value: number): void {
        const targetValue = Math.max(0.0001, value); // Target value (avoid 0 for exponential ramp)
        console.log(`SoundManager: Updating Master Gain from ${this.masterGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`);
        this.masterGainNode.gain.exponentialRampToValueAtTime(
            targetValue,
            this.audioContext.currentTime + 0.05 // Ramp duration (e.g., 50ms)
        );
    }

    private updateMusicVolume(multiplier: number): void {
        const targetValue = Math.max(0.0001, multiplier);
        console.log(`SoundManager: Updating Music Gain Multiplier from ${this.musicGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`);
        this.musicGainNode.gain.exponentialRampToValueAtTime(
            targetValue,
            this.audioContext.currentTime + 0.05
        );
    }

     private updateSfxVolume(multiplier: number): void {
        const targetValue = Math.max(0.0001, multiplier);
         console.log(`SoundManager: Updating SFX Gain Multiplier from ${this.sfxGainNode.gain.value.toFixed(3)} to ${targetValue.toFixed(3)}`);
        this.sfxGainNode.gain.exponentialRampToValueAtTime(
            targetValue,
            this.audioContext.currentTime + 0.05
        );
    }


    // --- Play Methods ---
    playSound(key: string, loop: boolean = false): AudioBufferSourceNode | null {
        // Ensure context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.error("AudioContext resume failed:", e));
        }

        const buffer = this.assetLoader.getAsset<AudioBuffer>(key);
        if (buffer instanceof AudioBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            // Connect to the SFX gain node
            source.connect(this.sfxGainNode);
            source.start(0);
            console.log(`Playing SFX: ${key}`);
            return source;
        } else {
            console.warn(`Sound asset not found or not an AudioBuffer: ${key}`);
            return null;
        }
    }

    playMusic(key: string): void {
        // Ensure context is running
        if (this.audioContext.state === 'suspended') {
            console.log("AudioContext is suspended, attempting resume...");
            this.audioContext.resume().catch(e => console.error("AudioContext resume failed:", e));
        }
        console.log(`Attempting to play music: ${key}. AudioContext state: ${this.audioContext.state}`);

        this.stopMusic(); // Stop any currently playing music

        const buffer = this.assetLoader.getAsset<AudioBuffer>(key);
        if (buffer instanceof AudioBuffer) {
            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = buffer;
            this.currentMusicSource.loop = true;
            // Connect to the Music gain node
            this.currentMusicSource.connect(this.musicGainNode);
            console.log(`SoundManager: Music source created and connected to musicGainNode (current gain: ${this.musicGainNode.gain.value.toFixed(3)}). Master gain: ${this.masterGainNode.gain.value.toFixed(3)}`);
            try {
                this.currentMusicSource.start(0);
                console.log(`SoundManager: Music '${key}' started.`);
            } catch (error) {
                 console.error(`SoundManager: Error starting music source for '${key}':`, error);
            }
        } else {
            console.warn(`Music asset not found or not an AudioBuffer: ${key}`);
        }
    }

    stopMusic(): void {
        if (this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
            } catch (e) {
                 // Ignore errors if already stopped
            }
            this.currentMusicSource.disconnect(); // Disconnect node
            this.currentMusicSource = null;
            console.log('Music stopped.');
        }
    }

    // Optional: Method to stop all sounds (e.g., on pause)
    stopAllSounds(): void {
        // This is complex as you need to track all active SFX sources.
        // A simpler approach for pause is to ramp masterGainNode down to 0.
        console.warn("stopAllSounds() not fully implemented - consider muting master gain instead.");
        this.stopMusic();
    }

    // Call this on cleanup
    destroy(): void {
         // Remove listeners
        this.settingsManager.removeVolumeListener('master', this.updateMasterVolume.bind(this));
        this.settingsManager.removeVolumeListener('music', this.updateMusicVolume.bind(this));
        this.settingsManager.removeVolumeListener('sfx', this.updateSfxVolume.bind(this));
        this.stopAllSounds();
        this.masterGainNode.disconnect();
        this.musicGainNode.disconnect();
        this.sfxGainNode.disconnect();
        console.log("SoundManager destroyed.");
    }
}
