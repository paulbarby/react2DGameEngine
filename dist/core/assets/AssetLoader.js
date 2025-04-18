var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class AssetLoader {
    constructor(audioContext) {
        this.loadedAssets = new Map();
        this.audioContext = audioContext;
    }
    loadManifest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch manifest: ${response.statusText}`);
                }
                const manifest = yield response.json();
                return manifest;
            }
            catch (error) {
                console.error(`Error loading manifest from ${url}:`, error);
                throw error; // Re-throw to allow caller handling
            }
        });
    }
    loadAllAssets(manifest) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            // Add 'music' to the type union
            const assetEntries = [];
            // Collect all assets to load
            for (const key in manifest.images) {
                assetEntries.push({ key, url: manifest.images[key], type: 'image' });
            }
            for (const key in manifest.sounds) {
                assetEntries.push({ key, url: manifest.sounds[key], type: 'sound' });
            }
            for (const key in manifest.spriteSheets) {
                assetEntries.push({ key, url: manifest.spriteSheets[key], type: 'spriteSheet' });
            }
            // Add music entries (just store URL)
            for (const key in manifest.music) {
                assetEntries.push({ key, url: manifest.music[key], type: 'music' });
            }
            // Create loading promises
            assetEntries.forEach(entry => {
                // Handle music type: Just store the URL string directly
                if (entry.type === 'music') {
                    this.loadedAssets.set(entry.key, entry.url);
                    console.log(`Registered music URL for key ${entry.key}: ${entry.url}`);
                    return; // No async loading needed for music URL itself
                }
                let loadPromise;
                switch (entry.type) {
                    case 'image':
                        loadPromise = this.loadImage(entry.url);
                        break;
                    case 'sound':
                        loadPromise = this.loadSound(entry.url);
                        break;
                    case 'spriteSheet':
                        loadPromise = this.loadJson(entry.url);
                        break;
                    default:
                        console.warn(`Unknown asset type for key ${entry.key}`);
                        return; // Skip unknown types
                }
                promises.push(loadPromise
                    .then(asset => {
                    this.loadedAssets.set(entry.key, asset);
                    // If it's a sprite sheet definition, also load its associated image
                    if (entry.type === 'spriteSheet') {
                        const def = asset;
                        if (def.image && manifest.images[def.image]) {
                            // Avoid duplicate loading if image is already listed separately
                            if (!this.loadedAssets.has(def.image)) {
                                return this.loadImage(manifest.images[def.image]).then(img => {
                                    this.loadedAssets.set(def.image, img);
                                });
                            }
                        }
                        else {
                            console.warn(`Sprite sheet definition ${entry.key} references image ${def.image}, which is not in the manifest's images.`);
                        }
                    }
                })
                    .catch(error => {
                    console.error(`Failed to load asset ${entry.key} from ${entry.url}:`, error);
                    // Decide if loading should fail entirely or just skip this asset
                }));
            });
            try {
                yield Promise.all(promises);
                console.log('All assets loaded successfully.');
            }
            catch (error) {
                console.error('Error during asset loading:', error);
                // Handle aggregate loading failure if necessary
            }
        });
    }
    loadImage(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(new Error(`Failed to load image: ${url}. Error: ${err}`));
                img.src = url;
            });
        });
    }
    loadSound(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = yield response.arrayBuffer();
                const audioBuffer = yield this.audioContext.decodeAudioData(arrayBuffer);
                return audioBuffer;
            }
            catch (error) {
                console.error(`Failed to load sound: ${url}`, error);
                throw error;
            }
        });
    }
    loadJson(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                return data;
            }
            catch (error) {
                console.error(`Failed to load JSON: ${url}`, error);
                throw error;
            }
        });
    }
    getAsset(key) {
        return this.loadedAssets.get(key);
    }
    getSpriteSheetDefinition(key) {
        const asset = this.loadedAssets.get(key);
        // Basic type check (might need more robust validation)
        if (asset && typeof asset === 'object' && 'frameWidth' in asset && 'sprites' in asset) {
            return asset;
        }
        return undefined;
    }
}
