import { AssetManifest, SpriteDefinition } from '../../types/project.js'; // Added .js
import { Asset, LoadedAssets } from '../../types/core.js'; // Added .js

export class AssetLoader {
    public loadedAssets: LoadedAssets = new Map();
    private audioContext: AudioContext;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
    }

    async loadManifest(url: string): Promise<AssetManifest> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch manifest: ${response.statusText}`);
            }
            const manifest: AssetManifest = await response.json();
            return manifest;
        } catch (error) {
            console.error(`Error loading manifest from ${url}:`, error);
            throw error; // Re-throw to allow caller handling
        }
    }

    async loadAllAssets(manifest: AssetManifest): Promise<void> {
        const promises: Promise<void>[] = [];
        const imagesToLoad: Map<string, string> = new Map(); // Map imageKey to url
        const soundsToLoad: Map<string, string> = new Map(); // Map soundKey to url
        const sheetsToLoad: Map<string, string> = new Map(); // Map sheetKey to url
        const musicToRegister: Map<string, string> = new Map(); // Map musicKey to url

        // 1. Collect all explicitly listed assets
        for (const key in manifest.images) {
            imagesToLoad.set(key, manifest.images[key]);
        }
        for (const key in manifest.sounds) {
            soundsToLoad.set(key, manifest.sounds[key]);
        }
        for (const key in manifest.spriteSheets) {
            sheetsToLoad.set(key, manifest.spriteSheets[key]);
        }
        for (const key in manifest.music) {
            musicToRegister.set(key, manifest.music[key]);
        }

        // 2. Load all sprite sheet definitions FIRST to find their image dependencies
        const sheetDefinitionPromises: Promise<void>[] = [];
        for (const [key, url] of sheetsToLoad.entries()) {
            sheetDefinitionPromises.push(
                this.loadJson<SpriteDefinition>(url)
                    .then(def => {
                        this.loadedAssets.set(key, def); // Store definition
                        // Check if the definition's image is in the manifest and add it to imagesToLoad if not already there
                        if (def.image && manifest.images[def.image]) {
                            if (!imagesToLoad.has(def.image)) {
                                imagesToLoad.set(def.image, manifest.images[def.image]);
                                console.log(`AssetLoader: Added image '${def.image}' from spritesheet '${key}' to load list.`);
                            }
                        } else if (def.image) {
                            console.warn(`AssetLoader: Sprite sheet '${key}' references image '${def.image}', but it's missing from manifest.images.`);
                        }
                    })
                    .catch(error => {
                        console.error(`Failed to load sprite sheet definition ${key} from ${url}:`, error);
                    })
            );
        }
        // Wait for all definitions to load before proceeding
        await Promise.all(sheetDefinitionPromises);
        console.log(`AssetLoader: Finished loading ${sheetsToLoad.size} sprite sheet definitions.`);

        // 3. Create loading promises for all identified images and sounds
        for (const [key, url] of imagesToLoad.entries()) {
            // Avoid reloading if already loaded (e.g., by sheet definition step, though unlikely now)
            if (!this.loadedAssets.has(key)) {
                promises.push(
                    this.loadImage(url)
                        .then(asset => { this.loadedAssets.set(key, asset); })
                        .catch(error => console.error(`Failed to load image ${key} from ${url}:`, error))
                );
            }
        }
        for (const [key, url] of soundsToLoad.entries()) {
             if (!this.loadedAssets.has(key)) {
                promises.push(
                    this.loadSound(url)
                        .then(asset => { this.loadedAssets.set(key, asset); })
                        .catch(error => console.error(`Failed to load sound ${key} from ${url}:`, error))
                );
            }
        }

        // 4. Register music URLs (no async loading needed here)
        for (const [key, url] of musicToRegister.entries()) {
            this.loadedAssets.set(key, url);
            console.log(`Registered music URL for key ${key}: ${url}`);
        }

        // 5. Wait for all images and sounds to load
        try {
            await Promise.all(promises);
            console.log(`AssetLoader: Successfully loaded ${imagesToLoad.size} images and ${soundsToLoad.size} sounds.`);
        } catch (error) {
            console.error('AssetLoader: Error during final asset loading phase:', error);
            // Handle aggregate loading failure if necessary
        }
    }

    private async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image: ${url}. Error: ${err}`));
            img.src = url;
        });
    }

    private async loadSound(url: string): Promise<AudioBuffer> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${url}`, error);
            throw error;
        }
    }

    private async loadJson<T>(url: string): Promise<T> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: T = await response.json();
            return data;
        } catch (error) {
            console.error(`Failed to load JSON: ${url}`, error);
            throw error;
        }
    }

    getAsset<T extends Asset>(key: string): T | undefined {
        return this.loadedAssets.get(key) as T | undefined;
    }

    getSpriteSheetDefinition(key: string): SpriteDefinition | undefined {
        const asset = this.loadedAssets.get(key);
        // Basic type check (might need more robust validation)
        if (asset && typeof asset === 'object' && 'frameWidth' in asset && 'sprites' in asset) {
            return asset as SpriteDefinition;
        }
        return undefined;
    }
}
