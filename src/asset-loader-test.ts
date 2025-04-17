import { AssetLoader } from './core/assets/AssetLoader.js'; // Note .js extension
import { AssetManifest, SpriteDefinition } from './types/project.js'; // Note .js extension
import { Asset } from './types/core.js'; // Note .js extension

const loadButton = document.getElementById('load-button');
const statusEl = document.getElementById('status');
const manifestContentEl = document.getElementById('manifest-content');
const logEl = document.getElementById('log');
const loadedAssetsEl = document.getElementById('loaded-assets');

function log(message: string, type: 'info' | 'error' | 'success' = 'info') {
    console.log(message);
    if (logEl) {
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (type === 'error') entry.classList.add('error');
        if (type === 'success') entry.classList.add('success');
        logEl.appendChild(entry);
        // Scroll to bottom
        logEl.scrollTop = logEl.scrollHeight;
    }
}

function updateStatus(message: string, type: 'info' | 'error' | 'success' = 'info') {
     if (statusEl) {
         statusEl.textContent = `Status: ${message}`;
         statusEl.className = type; // Use classes for styling
     }
}

function displayLoadedAssets(assets: Map<string, Asset>) {
    if (!loadedAssetsEl) return;
    loadedAssetsEl.innerHTML = ''; // Clear previous

    assets.forEach((asset, key) => {
        const item = document.createElement('div');
        let content = `<strong>${key}:</strong> `;

        if (asset instanceof HTMLImageElement) {
            content += `Image <img src="${asset.src}" alt="${key}"> (${asset.naturalWidth}x${asset.naturalHeight})`;
        } else if (asset instanceof AudioBuffer) {
            content += `AudioBuffer (Duration: ${asset.duration.toFixed(2)}s)`;
        } else if (typeof asset === 'object' && 'frameWidth' in asset) { // Basic check for SpriteDefinition
            const def = asset as SpriteDefinition;
            content += `SpriteDefinition (Image: ${def.image}, ${Object.keys(def.sprites).length} sprites)`;
        } else {
             content += `Unknown asset type`;
        }
        item.innerHTML = content;
        loadedAssetsEl.appendChild(item);
    });
     if (assets.size === 0) {
         loadedAssetsEl.innerHTML = 'None';
     }
}


async function runAssetLoaderTest() {
    if (!loadButton || !statusEl || !manifestContentEl || !logEl || !loadedAssetsEl) {
        console.error('Required HTML elements not found!');
        return;
    }

    logEl.innerHTML = ''; // Clear log
    updateStatus('Initializing...', 'info');
    loadedAssetsEl.innerHTML = 'None';
    manifestContentEl.textContent = 'Loading...';

    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume context on user interaction if needed (important for audio)
        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => log('AudioContext resumed.', 'success')).catch(e => log(`AudioContext resume failed: ${e}`, 'error'));
            }
            document.removeEventListener('click', resumeContext); // Run only once
            document.removeEventListener('keydown', resumeContext);
        };
        document.addEventListener('click', resumeContext);
        document.addEventListener('keydown', resumeContext);

    } catch (e) {
        log('Web Audio API is not supported in this browser.', 'error');
        updateStatus('Error: Web Audio API not supported', 'error');
        return;
    }

    const assetLoader = new AssetLoader(audioContext);
    const manifestUrl = '/assets/manifest.json'; // Path served by Express

    try {
        updateStatus('Loading manifest...', 'info');
        log(`Attempting to load manifest from ${manifestUrl}`);
        const manifest = await assetLoader.loadManifest(manifestUrl);
        log('Manifest loaded successfully.', 'success');
        manifestContentEl.textContent = JSON.stringify(manifest, null, 2);

        updateStatus('Loading all assets...', 'info');
        log('Starting loadAllAssets...');
        await assetLoader.loadAllAssets(manifest);
        log('loadAllAssets finished.', 'success');
        updateStatus('All assets processed.', 'success');

        log(`Total assets in loader: ${assetLoader.loadedAssets.size}`);
        displayLoadedAssets(assetLoader.loadedAssets);

    } catch (error: any) {
        log(`An error occurred: ${error.message}`, 'error');
        updateStatus(`Error: ${error.message}`, 'error');
        manifestContentEl.textContent = 'Failed to load.';
        // Display any partially loaded assets
        displayLoadedAssets(assetLoader.loadedAssets);
    }
}

if (loadButton) {
    loadButton.addEventListener('click', runAssetLoaderTest);
} else {
    console.error('Load button not found!');
}
