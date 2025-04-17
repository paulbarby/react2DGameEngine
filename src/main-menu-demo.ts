// --- Get Element References ---
const startButton = document.getElementById('start-button');
const scoresButton = document.getElementById('scores-button');
const optionsButton = document.getElementById('options-button');
const exitButton = document.getElementById('exit-button');

const scoresPanel = document.getElementById('scores-panel');
const optionsPanel = document.getElementById('options-panel');

const closeButtons = document.querySelectorAll('.close-button');

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

// --- Event Listeners ---

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

// Options Panel - Example interaction (logging changes)
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
const sfxToggle = document.getElementById('sfx-toggle') as HTMLInputElement | null;
const musicToggle = document.getElementById('music-toggle') as HTMLInputElement | null;

if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
        console.log(`Volume changed to: ${volumeSlider.value}`);
        // Here you would typically update the actual game volume
    });
}
if (sfxToggle) {
    sfxToggle.addEventListener('change', () => {
        console.log(`Sound Effects ${sfxToggle.checked ? 'Enabled' : 'Disabled'}`);
        // Update game settings
    });
}
if (musicToggle) {
    musicToggle.addEventListener('change', () => {
        console.log(`Music ${musicToggle.checked ? 'Enabled' : 'Disabled'}`);
        // Update game settings
    });
}


console.log('Main Menu UI Demo script loaded and listeners attached.');
