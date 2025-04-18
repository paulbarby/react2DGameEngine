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
        this.loadingErrors = []; // Track errors
        this.audioContext = audioContext;
    }
    loadManifest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`AssetLoader: Fetching manifest from ${url}...`);
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
                const manifest = yield response.json();
                console.log('AssetLoader: Manifest loaded successfully.');
                return manifest;
            }
            catch (error) {
                console.error(`AssetLoader: Failed to load manifest from ${url}:`, error);
                throw error; // Re-throw
            }
        });
    }
    loadAllAssets(manifest) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            // Images
            if (manifest.images) {
                for (const key in manifest.images) {
                    const url = manifest.images[key];
                    // Only push promise, don't set in loadedAssets here
                    promises.push(this.loadImage(key, url));
                }
            }
            // Sprite Sheets (JSON definitions)
            if (manifest.spriteSheets) {
                for (const key in manifest.spriteSheets) {
                    const url = manifest.spriteSheets[key];
                    // Only push promise, don't set in loadedAssets here
                    promises.push(this.loadJson(key, url));
                }
            }
            // Sounds
            if (manifest.sounds) {
                for (const key in manifest.sounds) {
                    const url = manifest.sounds[key];
                    console.log(`AssetLoader: Queueing sound ${key} from ${url}`);
                    // Only push promise, loadSound will set in loadedAssets
                    promises.push(this.loadSound(key, url));
                }
            }
            // Music (Treat same as sounds for loading)
            if (manifest.music) {
                for (const key in manifest.music) {
                    const url = manifest.music[key];
                    console.log(`AssetLoader: Queueing music ${key} from ${url}`);
                    // Only push promise, loadSound will set in loadedAssets
                    promises.push(this.loadSound(key, url));
                }
            }
            try {
                yield Promise.all(promises);
                console.log('AssetLoader: Successfully loaded all assets.');
                console.log('AssetLoader: Final loaded assets map:', this.loadedAssets); // Log final map
            }
            catch (error) {
                console.error('AssetLoader: Error loading one or more assets:', error);
                // Consider if loading should continue or stop on error
                // throw error; // Option: Re-throw to stop everything
            }
        });
    }
    // Modified to accept key and store asset
    loadImage(key, url) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`AssetLoader: Loading image for key '${key}' from ${url}...`);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.loadedAssets.set(key, img); // Store the loaded image
                    console.log(`AssetLoader: Successfully loaded image for key '${key}'.`);
                    resolve();
                };
                img.onerror = (error) => {
                    console.error(`AssetLoader: Failed to load image for key '${key}' from ${url}:`, error);
                    reject(new Error(`Failed to load image: ${url}`));
                };
                img.src = url;
            });
        });
    }
    // Modified to accept key and store asset
    loadJson(key, url) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`AssetLoader: Loading JSON for key '${key}' from ${url}...`);
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
                const data = yield response.json();
                this.loadedAssets.set(key, data); // Store the parsed JSON
                console.log(`AssetLoader: Successfully loaded JSON for key '${key}'.`);
            }
            catch (error) {
                console.error(`AssetLoader: Failed to load JSON for key '${key}' from ${url}:`, error);
                throw error; // Re-throw
            }
        });
    }
    loadSound(key, url) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`AssetLoader: Fetching sound/music for key '${key}' from ${url}...`);
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    // Include URL and status in error
                    throw new Error(`HTTP error loading sound at ${url}! status: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = yield response.arrayBuffer();
                console.log(`AssetLoader: Fetched ${url}, got ${arrayBuffer.byteLength} bytes. Decoding...`);
                // Add try-catch specifically around decodeAudioData
                try {
                    const audioBuffer = yield this.audioContext.decodeAudioData(arrayBuffer);
                    this.loadedAssets.set(key, audioBuffer); // Use key here
                    console.log(`AssetLoader: Successfully decoded and stored sound/music for key '${key}'. Duration: ${audioBuffer.duration.toFixed(2)}s`);
                }
                catch (decodeError) {
                    throw new Error(`Failed to decode audio data from ${url}. Error: ${decodeError}`);
                }
            }
            catch (error) {
                // Log and rethrow the more specific error
                console.error(`AssetLoader Error: Failed to load or decode sound/music for key '${key}' from ${url}:`, error);
                // Decide if you want to throw or just log the error
                // throw error; // Option: Stop all loading if one sound fails
            }
        });
    }
    getAsset(key) {
        var _a;
        const asset = this.loadedAssets.get(key);
        console.log(`AssetLoader.getAsset('${key}'): Found asset = ${!!asset}, Type = ${(_a = asset === null || asset === void 0 ? void 0 : asset.constructor) === null || _a === void 0 ? void 0 : _a.name}`); // Log retrieval attempt
        if (asset === undefined) {
            // Log warning if asset key is not found
            console.warn(`AssetLoader: Asset with key "${key}" not found.`);
        }
        // Basic type check could be added here if T was more specific at runtime
        return asset;
    }
    getSpriteSheetDefinition(key) {
        const asset = this.loadedAssets.get(key);
        if (asset === undefined) {
            console.warn(`AssetLoader: Sprite sheet definition with key "${key}" not found.`);
            return undefined;
        }
        // More robust type check for sprite sheet definition structure
        if (asset && typeof asset === 'object' && 'image' in asset && 'frameWidth' in asset && 'frameHeight' in asset && 'sprites' in asset) {
            return asset;
        }
        else {
            // Log warning if the found asset doesn't look like a SpriteDefinition
            console.warn(`AssetLoader: Asset found for key "${key}", but it does not appear to be a valid SpriteDefinition.`, asset);
            return undefined;
        }
    }
    // Optional: Method to retrieve loading errors
    getLoadingErrors() {
        return [...this.loadingErrors]; // Return a copy
    }
}
