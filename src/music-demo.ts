import { AssetLoader } from './core/assets/AssetLoader.js';
import { SoundManager } from './core/sound/SoundManager.js';

const statusEl = document.getElementById('status');
const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const stopButton = document.getElementById('stop-button');
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
const volumeValueSpan = document.getElementById('volume-value');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = `Status: ${message}`;
    console.log(message);
}

async function main() {
    if (!playButton || !pauseButton || !resumeButton || !stopButton || !volumeSlider || !volumeValueSpan) {
        updateStatus('Error: HTML control elements not found!');
        return;
    }

    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume context on interaction (important for audio playback)
        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(e => console.error(`AudioContext resume failed: ${e}`));
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', resumeContext);
            document.removeEventListener('keydown', resumeContext);
        };
        document.addEventListener('click', resumeContext);
        document.addEventListener('keydown', resumeContext);
    } catch (e) {
        updateStatus('Error: Web Audio API not supported.');
        return;
    }

    const assetLoader = new AssetLoader(audioContext);
    const soundManager = new SoundManager(audioContext, assetLoader);

    // --- Load Assets ---
    const manifestUrl = '/assets/manifest.json';
    try {
        updateStatus(`Loading manifest from ${manifestUrl}...`);
        const manifest = await assetLoader.loadManifest(manifestUrl);
        updateStatus('Loading all assets (registering music)...');
        // This will now register the music URL
        await assetLoader.loadAllAssets(manifest);
        updateStatus('Assets loaded/registered.');
    } catch (error: any) {
        updateStatus(`Error loading assets: ${error.message}`);
        return;
    }

    // --- Setup Controls ---
    const musicKey = 'backgroundTheme'; // Key from manifest

    playButton.addEventListener('click', () => {
        updateStatus(`Playing ${musicKey}...`);
        soundManager.playMusic(musicKey, true); // Play looped
    });

    pauseButton.addEventListener('click', () => {
        updateStatus('Pausing music...');
        soundManager.pauseMusic();
    });

    resumeButton.addEventListener('click', () => {
        updateStatus('Resuming music...');
        soundManager.resumeMusic();
    });

    stopButton.addEventListener('click', () => {
        updateStatus('Stopping music...');
        soundManager.stopMusic();
    });

    volumeSlider.addEventListener('input', () => {
        const volume = parseFloat(volumeSlider.value);
        soundManager.setMusicVolume(volume);
        if (volumeValueSpan) {
            volumeValueSpan.textContent = volume.toFixed(2);
        }
        updateStatus(`Set music volume to ${volume.toFixed(2)}`);
    });

    // Initialize volume display
    const initialVolume = soundManager.getMusicVolume();
    volumeSlider.value = initialVolume.toString();
     if (volumeValueSpan) {
        volumeValueSpan.textContent = initialVolume.toFixed(2);
    }

    updateStatus('Ready. Click Play Theme.');
}

main().catch(err => {
    updateStatus(`Unhandled error: ${err.message}`);
    console.error(err);
});
