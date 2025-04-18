// Import necessary classes (assuming they exist and are needed for a full demo)
// import { AssetLoader } from './core/assets/AssetLoader.js';
// import { SoundManager } from './core/sound/SoundManager.js';
import { SettingsManager } from './core/settings/SettingsManager.js';

// --- Get Element References ---
const startButton = document.getElementById('start-button');
const scoresButton = document.getElementById('scores-button');
const optionsButton = document.getElementById('options-button');
const exitButton = document.getElementById('exit-button');

const scoresPanel = document.getElementById('scores-panel');
const optionsPanel = document.getElementById('options-panel');

const closeButtons = document.querySelectorAll('.close-button');

const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
const sfxToggle = document.getElementById('sfx-toggle') as HTMLInputElement | null;
const musicToggle = document.getElementById('music-toggle') as HTMLInputElement | null;

// --- Instantiate Core Systems (Minimal for UI Demo) ---
const settingsManager = new SettingsManager();
// const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
// const assetLoader = new AssetLoader(audioContext);
// const soundManager = new SoundManager(audioContext, assetLoader, settingsManager); // Pass settingsManager

// --- Helper Functions ---
function showPanel(panel: HTMLElement | null) {
    if (!panel) return;
    // Hide other panels first
    hideAllPanels();
    panel.style.display = 'block';
    console.log(`Showing panel: ${panel.id}`);
}

function hidePanel(panel: HTMLElement | null) {
    if (!panel) return;
    panel.style.display = 'none';
    console.log(`Hiding panel: ${panel.id}`);
}

function hideAllPanels() {
    hidePanel(scoresPanel);
    hidePanel(optionsPanel);
}

// --- Load Settings and Initialize UI ---
async function initializeDemo() {
    console.log('Initializing Main Menu Demo...');
    await settingsManager.loadSettings(); // Load settings first

    // Initialize UI elements with loaded settings
    if (volumeSlider) {
        const masterVolume = settingsManager.getMasterVolume();
        volumeSlider.value = String(masterVolume * 100); // Set slider position (0-100)
        console.log(`Initialized volume slider to ${volumeSlider.value}`);
    }
    // Initialize toggles based on settings if applicable (using multipliers for now)
    if (sfxToggle) {
        sfxToggle.checked = settingsManager.getSfxVolumeMultiplier() > 0;
    }
     if (musicToggle) {
        musicToggle.checked = settingsManager.getMusicVolumeMultiplier() > 0;
    }

    attachEventListeners(); // Attach listeners after settings are loaded
    console.log('Main Menu UI Demo script loaded and listeners attached.');
}


// --- Event Listeners ---
function attachEventListeners() {
    // Main Menu Buttons
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start Game button clicked');
            alert('Starting Game... (placeholder)');
            // In a real game, you'd transition to the game state/scene here
        });
    }

    if (scoresButton) {
        scoresButton.addEventListener('click', () => {
            console.log('High Scores button clicked');
            showPanel(scoresPanel);
        });
    }

    if (optionsButton) {
        optionsButton.addEventListener('click', () => {
            console.log('Options button clicked');
            showPanel(optionsPanel);
        });
    }

    if (exitButton) {
        exitButton.addEventListener('click', () => {
            console.log('Exit button clicked');
            alert('Exiting... (placeholder - cannot close browser tab via script)');
            // In an Electron/desktop app, you might close the window here
        });
    }

    // Close Buttons for Panels
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const panelId = target.getAttribute('data-panel');
            if (panelId) {
                const panelToClose = document.getElementById(panelId);
                hidePanel(panelToClose);
            }
        });
    });

    // Options Panel Interactions
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            const volumeValue = parseInt(volumeSlider.value, 10) / 100; // Convert 0-100 to 0.0-1.0
            console.log(`UI: Volume slider changed to: ${volumeSlider.value} (Setting value: ${volumeValue.toFixed(2)})`);
            settingsManager.setMasterVolume(volumeValue); // Update setting
            // SoundManager will react via its listener
        });
    }
    if (sfxToggle) {
        sfxToggle.addEventListener('change', () => {
            const isEnabled = sfxToggle.checked;
            console.log(`UI: Sound Effects ${isEnabled ? 'Enabled' : 'Disabled'}`);
            // Update setting - For now, just toggle between 1.0 and 0.0 multiplier
            // settingsManager.setSfxVolumeMultiplier(isEnabled ? 1.0 : 0.0);
            // SoundManager will react via its listener
            alert("SFX toggle functionality not fully implemented in SettingsManager yet.");
        });
    }
    if (musicToggle) {
        musicToggle.addEventListener('change', () => {
            const isEnabled = musicToggle.checked;
            console.log(`UI: Music ${isEnabled ? 'Enabled' : 'Disabled'}`);
            // Update setting - For now, just toggle between 1.0 and 0.0 multiplier
            // settingsManager.setMusicVolumeMultiplier(isEnabled ? 1.0 : 0.0);
            // SoundManager will react via its listener
            alert("Music toggle functionality not fully implemented in SettingsManager yet.");
        });
    }
}

// --- Start Initialization ---
initializeDemo().catch(err => console.error("Initialization failed:", err));
