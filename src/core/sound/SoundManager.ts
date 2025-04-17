import { AssetLoader } from '../assets/AssetLoader';

export class SoundManager {
    private audioContext: AudioContext;
    private assetLoader: AssetLoader;
    // Optional: Keep track of active sounds
    // private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();

    constructor(audioContext: AudioContext, assetLoader: AssetLoader) {
        this.audioContext = audioContext;
        this.assetLoader = assetLoader;
    }

    playSound(key: string, loop: boolean = false): AudioBufferSourceNode | null {
        const asset = this.assetLoader.getAsset<AudioBuffer>(key);

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

        } catch (error) {
            console.error(`Error playing sound "${key}":`, error);
            return null;
        }
    }

    stopSound(source: AudioBufferSourceNode): void {
        try {
            source.stop();
            // Manually trigger onended cleanup if tracking sources
            // source.onended?.(new Event('manualstop'));
            // source.onended = null; // Prevent double cleanup
            console.log(`Stopped sound.`);
        } catch (error) {
            // Ignore errors if the sound already stopped naturally
            if (error instanceof DOMException && error.name === 'InvalidStateError') {
                // Sound likely already stopped
            } else {
                console.error('Error stopping sound:', error);
            }
        }
    }

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
    resumeContext(): void {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully.');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
        }
    }
}
