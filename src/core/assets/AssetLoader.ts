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
        const assetEntries: { key: string, url: string, type: 'image' | 'sound' | 'spriteSheet' }[] = [];

        // Collect all assets to load
        for (const key in manifest.images) {
            assetEntries.push({ key, url: manifest.images[key], type: 'image' });
        }
        for (const key in manifest.sounds) {
            assetEntries.push({ key, url: manifest.sounds[key], type: 'sound' });
        }
        for (const key in manifest.spriteSheets) {
            // Sprite sheet definitions are JSON files
            assetEntries.push({ key, url: manifest.spriteSheets[key], type: 'spriteSheet' });
        }

        // Create loading promises
        assetEntries.forEach(entry => {
            let loadPromise: Promise<Asset>;
            switch (entry.type) {
                case 'image':
                    loadPromise = this.loadImage(entry.url);
                    break;
                case 'sound':
                    loadPromise = this.loadSound(entry.url);
                    break;
                case 'spriteSheet':
                    loadPromise = this.loadJson<SpriteDefinition>(entry.url);
                    break;
                default:
                    console.warn(`Unknown asset type for key ${entry.key}`);
                    return; // Skip unknown types
            }

            promises.push(
                loadPromise
                    .then(asset => {
                        this.loadedAssets.set(entry.key, asset);
                        // If it's a sprite sheet definition, also load its associated image
                        if (entry.type === 'spriteSheet') {
                            const def = asset as SpriteDefinition;
                            if (def.image && manifest.images[def.image]) {
                                // Avoid duplicate loading if image is already listed separately
                                if (!this.loadedAssets.has(def.image)) {
                                    return this.loadImage(manifest.images[def.image]).then(img => {
                                        this.loadedAssets.set(def.image, img);
                                    });
                                }
                            } else {
                                console.warn(`Sprite sheet definition ${entry.key} references image ${def.image}, which is not in the manifest's images.`);
                            }
                        }
                    })
                    .catch(error => {
                        console.error(`Failed to load asset ${entry.key} from ${entry.url}:`, error);
                        // Decide if loading should fail entirely or just skip this asset
                    })
            );
        });

        try {
            await Promise.all(promises);
            console.log('All assets loaded successfully.');
        } catch (error) {
            console.error('Error during asset loading:', error);
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
