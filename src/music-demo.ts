import { AssetLoader } from './core/assets/AssetLoader.js';
import { SoundManager } from './core/sound/SoundManager.js';
import { SettingsManager } from './core/settings/SettingsManager.js'; // Import SettingsManager

const statusEl = document.getElementById('status');
const playButton = document.getElementById('play-button');
const stopButton = document.getElementById('stop-button');
const pauseButton = document.getElementById('pause-button'); // Assuming a pause button exists
const resumeButton = document.getElementById('resume-button'); // Assuming a resume button exists
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
const musicSelect = document.getElementById('music-select') as HTMLSelectElement | null;
const volumeValueSpan = document.getElementById('volume-value'); // Get the span

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

// --- Event Listeners ---
function attachEventListeners(settingsManager: SettingsManager, soundManager: SoundManager) { // Pass managers
    console.log("Attaching event listeners..."); // Log listener attachment start

    if (playButton && musicSelect) {
        console.log("Found playButton and musicSelect, attaching listener."); // Confirm elements found
        playButton.addEventListener('click', () => {
            // <<< ADD LOGGING HERE >>>
            console.log("Play button clicked!");
            const musicKey = musicSelect.value;
            console.log(`Selected music key: ${musicKey}`);

            if (musicKey) {
                // Log current volume settings before playing
                const currentMaster = settingsManager.getMasterVolume();
                const currentMusicMult = settingsManager.getMusicVolumeMultiplier();
                console.log(`Current volumes before play: Master=${currentMaster.toFixed(2)}, MusicMultiplier=${currentMusicMult.toFixed(2)}`);

                updateStatus(`Playing ${musicKey}...`);
                soundManager.playMusic(musicKey);

                // Ensure volume multiplier is not 0 if it was paused
                if (settingsManager.getMusicVolumeMultiplier() === 0) {
                    console.log("Music volume multiplier was 0, restoring to 1.0 on play.");
                    settingsManager.setMusicVolumeMultiplier(1.0);
                    if (volumeSlider) {
                        volumeSlider.value = "100";
                    }
                }
            } else {
                updateStatus('Please select music to play.');
                console.log("No music key selected.");
            }
        });
    } else {
        console.error("Could not find playButton or musicSelect elements!"); // Error if elements missing
    }

    if (stopButton) {
        stopButton.addEventListener('click', () => {
            updateStatus('Stopping music...');
            soundManager.stopMusic();
        });
    }

    // --- Pause/Resume using SettingsManager ---
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            updateStatus('Pausing music...');
            // Just set multiplier to 0
            settingsManager.setMusicVolumeMultiplier(0);
        });
    }

    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            updateStatus('Resuming music...');
            // Restore previous volume - Restore to 1.0 if it's 0, otherwise leave as is
            // This assumes "resume" means "make audible", not necessarily restore exact previous level.
            // If the user adjusted master volume while paused, this keeps that adjustment.
            if (settingsManager.getMusicVolumeMultiplier() === 0) {
                 console.log("Music volume was 0, restoring multiplier to 1.0 on resume.");
                 settingsManager.setMusicVolumeMultiplier(1.0);
                 // Update slider to reflect this change
                 if (volumeSlider) {
                     volumeSlider.value = "100";
                 }
            } else {
                console.log("Music volume multiplier already > 0, no change on resume.");
            }
        });
    }

    // --- Volume Control using SettingsManager ---
    if (volumeSlider) {
        // Initialize slider and span
        const initialVolumeMultiplier = settingsManager.getMusicVolumeMultiplier();
        volumeSlider.value = String(initialVolumeMultiplier * 100);
        if (volumeValueSpan) {
            volumeValueSpan.textContent = volumeSlider.value;
        }

        volumeSlider.addEventListener('input', () => {
            const volumeMultiplier = parseInt(volumeSlider.value, 10) / 100;
            updateStatus(`Setting music volume multiplier to ${volumeMultiplier.toFixed(2)}`);
            settingsManager.setMusicVolumeMultiplier(volumeMultiplier);
            // Update the span
            if (volumeValueSpan) {
                volumeValueSpan.textContent = volumeSlider.value;
            }
        });
    }
}

async function initializeApp() {
    updateStatus('Initializing App...');

    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const resumeContext = () => { /* ... resume logic ... */ if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); };
        document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext);
    } catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const settingsManager = new SettingsManager();
    console.log("initializeApp: Calling settingsManager.loadSettings()...");
    const loadedSettings = await settingsManager.loadSettings();
    console.log("initializeApp: settingsManager.loadSettings() finished.");

    if (!loadedSettings) {
        updateStatus("Error: Failed to load settings. Cannot initialize SoundManager.");
        return;
    }
    console.log("initializeApp: Settings loaded, proceeding to create SoundManager.");
    console.log(`initializeApp: Master volume from manager: ${settingsManager.getMasterVolume()}`);

    const assetLoader = new AssetLoader(audioContext);
    const soundManager = new SoundManager(audioContext, assetLoader, settingsManager);

    // --- Load Assets ---
    const manifestUrl = '/assets/manifest.json';
    let manifest;
    try {
        updateStatus('Loading assets...');
        manifest = await assetLoader.loadManifest(manifestUrl);
        await assetLoader.loadAllAssets(manifest);
        updateStatus('Assets loaded.');
    } catch (error: any) { updateStatus(`Error loading assets: ${error.message}`); return; }

    // --- Populate Music Select ---
    if (musicSelect && manifest?.music) {
        for (const key in manifest.music) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key; // Display the key as the option text
            musicSelect.appendChild(option);
        }
    }

    // --- Attach Event Listeners ---
    attachEventListeners(settingsManager, soundManager); // Pass managers

    updateStatus('Ready. Select music and press Play.');
}

// --- Run Initialization AFTER DOM is loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    initializeApp().catch(err => {
        updateStatus(`Unhandled initialization error: ${err.message}`);
        console.error(err);
    });
});
