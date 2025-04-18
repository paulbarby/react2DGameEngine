export class SoundManager {
    // Optional: Keep track of active sounds
    // private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
    constructor(audioContext, assetLoader) {
        this.currentMusic = null;
        this.musicVolume = 1.0; // Default music volume (0.0 to 1.0)
        this.audioContext = audioContext;
        this.assetLoader = assetLoader;
    }
    // --- Sound Effects ---
    playSound(key, loop = false) {
        const asset = this.assetLoader.getAsset(key);
        if (!asset) {
            console.warn(`Sound asset "${key}" not found or not loaded.`);
            return null;
        }
        if (!(asset instanceof AudioBuffer)) {
            console.warn(`Asset "${key}" is not an AudioBuffer.`);
            return null;
        }
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = asset;
            source.loop = loop;
            source.connect(this.audioContext.destination); // Connect to output
            // Optional: Track the source
            // if (!this.activeSources.has(key)) {
            //     this.activeSources.set(key, []);
            // }
            // this.activeSources.get(key)!.push(source);
            // source.onended = () => {
            //     // Remove from tracking when finished
            //     const sources = this.activeSources.get(key);
            //     if (sources) {
            //         const index = sources.indexOf(source);
            //         if (index > -1) {
            //             sources.splice(index, 1);
            //         }
            //     }
            // };
            source.start(0); // Play immediately
            console.log(`Playing sound: ${key}`);
            return source;
        }
        catch (error) {
            console.error(`Error playing sound "${key}":`, error);
            return null;
        }
    }
    stopSound(source) {
        try {
            source.stop();
            // Manually trigger onended cleanup if tracking sources
            // source.onended?.(new Event('manualstop'));
            // source.onended = null; // Prevent double cleanup
            console.log(`Stopped sound.`);
        }
        catch (error) {
            // Ignore errors if the sound already stopped naturally
            if (error instanceof DOMException && error.name === 'InvalidStateError') {
                // Sound likely already stopped
            }
            else {
                console.error('Error stopping sound:', error);
            }
        }
    }
    // --- Music ---
    playMusic(key, loop = true) {
        // Stop any currently playing music first
        this.stopMusic();
        // Get the URL from the AssetLoader
        const musicUrl = this.assetLoader.getAsset(key);
        if (!musicUrl || typeof musicUrl !== 'string') {
            console.warn(`Music asset URL for key "${key}" not found or invalid.`);
            return;
        }
        try {
            this.currentMusic = new Audio(musicUrl);
            this.currentMusic.loop = loop;
            this.currentMusic.volume = this.musicVolume; // Apply current volume setting
            this.currentMusic.play()
                .then(() => console.log(`Playing music: ${key}`))
                .catch(error => {
                console.error(`Error playing music "${key}":`, error);
                // Attempt to resume context if suspended (common issue)
                if (this.audioContext.state === 'suspended') {
                    console.log('AudioContext suspended, attempting resume...');
                    this.resumeContext();
                    // Optionally try playing again after resume, or instruct user interaction
                }
                this.currentMusic = null; // Clear if playback failed
            });
            // Handle cleanup if music ends naturally (and wasn't looped)
            this.currentMusic.onended = () => {
                var _a;
                if (!((_a = this.currentMusic) === null || _a === void 0 ? void 0 : _a.loop)) {
                    console.log(`Music "${key}" finished.`);
                    this.currentMusic = null;
                }
            };
        }
        catch (error) {
            console.error(`Error creating Audio element for music "${key}":`, error);
            this.currentMusic = null;
        }
    }
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0; // Reset playback position
            this.currentMusic.onended = null; // Remove listener
            console.log(`Stopped music.`);
            this.currentMusic = null;
        }
    }
    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            console.log(`Paused music.`);
        }
    }
    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play().catch(error => {
                console.error(`Error resuming music:`, error);
            });
            console.log(`Resumed music.`);
        }
    }
    setMusicVolume(volume) {
        // Clamp volume between 0.0 and 1.0
        this.musicVolume = Math.max(0.0, Math.min(1.0, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
        console.log(`Music volume set to: ${this.musicVolume.toFixed(2)}`);
    }
    getMusicVolume() {
        return this.musicVolume;
    }
    // --- General ---
    // Optional: Stop all sounds with a specific key
    // stopAllSounds(key: string): void {
    //     const sources = this.activeSources.get(key);
    //     if (sources) {
    //         // Iterate over a copy as stopSound might modify the array via onended
    //         [...sources].forEach(source => this.stopSound(source));
    //         console.log(`Stopped all sounds for key: ${key}`);
    //     }
    // }
    // Optional: Stop all sounds managed by the manager
    // stopAll(): void {
    //     console.log("Stopping all sounds.");
    //     // Iterate over a copy of keys
    //     const allKeys = Array.from(this.activeSources.keys());
    //     allKeys.forEach(key => this.stopAllSounds(key));
    // }
    // Optional: Method to resume AudioContext if suspended by browser policy
    resumeContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully.');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
        }
    }
}
