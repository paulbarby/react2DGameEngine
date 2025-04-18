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
            this.loadingErrors = []; // Clear previous errors
            const promises = [];
            const imagesToLoad = new Map();
            const soundsToLoad = new Map();
            const sheetsToLoad = new Map();
            const musicToRegister = new Map();
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
            // 2. Load all sprite sheet definitions FIRST
            const sheetDefinitionPromises = [];
            for (const [key, url] of sheetsToLoad.entries()) {
                sheetDefinitionPromises.push(this.loadJson(url)
                    .then(def => {
                    // Basic validation of the definition structure
                    if (!def || typeof def !== 'object' || !def.image || typeof def.frameWidth !== 'number' || typeof def.frameHeight !== 'number' || typeof def.sprites !== 'object') {
                        throw new Error(`Invalid sprite sheet definition structure for key '${key}'`);
                    }
                    this.loadedAssets.set(key, def);
                    // Check image dependency
                    if (def.image && manifest.images[def.image]) {
                        if (!imagesToLoad.has(def.image)) {
                            imagesToLoad.set(def.image, manifest.images[def.image]);
                            console.log(`AssetLoader: Added image '${def.image}' from spritesheet '${key}' to load list.`);
                        }
                    }
                    else if (def.image) {
                        // Log error if image is referenced but missing from manifest
                        const errorMsg = `Sprite sheet '${key}' references image '${def.image}', but it's missing from manifest.images.`;
                        console.error(`AssetLoader Error: ${errorMsg}`);
                        this.loadingErrors.push({ key: key, url: url, error: new Error(errorMsg) });
                    }
                    else {
                        // Log error if definition is missing the image property
                        const errorMsg = `Sprite sheet definition '${key}' is missing the required 'image' property.`;
                        console.error(`AssetLoader Error: ${errorMsg}`);
                        this.loadingErrors.push({ key: key, url: url, error: new Error(errorMsg) });
                    }
                })
                    .catch(error => {
                    // Catch errors loading or parsing the definition JSON itself
                    console.error(`AssetLoader Error: Failed to load or parse sprite sheet definition ${key} from ${url}:`, error);
                    this.loadingErrors.push({ key: key, url: url, error: error });
                }));
            }
            // Wait for all definitions to load/fail
            yield Promise.allSettled(sheetDefinitionPromises); // Use allSettled to continue even if some defs fail
            console.log(`AssetLoader: Finished processing ${sheetsToLoad.size} sprite sheet definitions.`);
            // 3. Create loading promises for images and sounds
            for (const [key, url] of imagesToLoad.entries()) {
                if (!this.loadedAssets.has(key)) {
                    promises.push(this.loadImage(url)
                        .then(asset => { this.loadedAssets.set(key, asset); })
                        .catch(error => {
                        console.error(`AssetLoader Error: Failed to load image ${key} from ${url}:`, error);
                        this.loadingErrors.push({ key: key, url: url, error: error });
                    }));
                }
            }
            for (const [key, url] of soundsToLoad.entries()) {
                if (!this.loadedAssets.has(key)) {
                    promises.push(this.loadSound(url)
                        .then(asset => { this.loadedAssets.set(key, asset); })
                        .catch(error => {
                        console.error(`AssetLoader Error: Failed to load sound ${key} from ${url}:`, error);
                        this.loadingErrors.push({ key: key, url: url, error: error });
                    }));
                }
            }
            // 4. Register music URLs
            for (const [key, url] of musicToRegister.entries()) {
                this.loadedAssets.set(key, url);
                console.log(`Registered music URL for key ${key}: ${url}`);
            }
            // 5. Wait for all images and sounds to load/fail
            yield Promise.allSettled(promises); // Use allSettled
            // 6. Report final status
            if (this.loadingErrors.length > 0) {
                console.error(`AssetLoader: Finished loading with ${this.loadingErrors.length} error(s).`);
                this.loadingErrors.forEach(err => console.error(` - Failed asset: ${err.key} (${err.url})`, err.error));
                return false; // Indicate failure
            }
            else {
                console.log(`AssetLoader: Successfully loaded all assets.`);
                return true; // Indicate success
            }
        });
    }
    loadImage(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                // Provide more specific error message including the URL
                img.onerror = (err) => reject(new Error(`Failed to load image at ${url}. Error event: ${err}`));
                img.src = url;
            });
        });
    }
    loadSound(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    // Include URL and status in error
                    throw new Error(`HTTP error loading sound at ${url}! status: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = yield response.arrayBuffer();
                // Add try-catch specifically around decodeAudioData
                try {
                    const audioBuffer = yield this.audioContext.decodeAudioData(arrayBuffer);
                    return audioBuffer;
                }
                catch (decodeError) {
                    throw new Error(`Failed to decode audio data from ${url}. Error: ${decodeError}`);
                }
            }
            catch (error) {
                // Log and rethrow the more specific error
                console.error(`AssetLoader Error: ${error}`);
                throw error;
            }
        });
    }
    loadJson(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    // Include URL and status in error
                    throw new Error(`HTTP error loading JSON at ${url}! status: ${response.status} ${response.statusText}`);
                }
                // Add try-catch specifically around response.json()
                try {
                    const data = yield response.json();
                    return data;
                }
                catch (parseError) {
                    throw new Error(`Failed to parse JSON data from ${url}. Error: ${parseError}`);
                }
            }
            catch (error) {
                // Log and rethrow the more specific error
                console.error(`AssetLoader Error: ${error}`);
                throw error;
            }
        });
    }
    getAsset(key) {
        const asset = this.loadedAssets.get(key);
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
