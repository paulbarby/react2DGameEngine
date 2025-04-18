import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { SoundManager } from './core/sound/SoundManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { SettingsManager } from './core/settings/SettingsManager.js';
import { EventBus } from './core/events/EventBus.js';
import { AppEvent, InputEvent } from './core/events/EventTypes.js';
import { AnimationComponent } from './core/components/AnimationComponent.js';
import { ExplosionCompletionComponent } from './core/components/ExplosionCompletionComponent.js'; // Import the new component

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

// --- Explosion Prefab ---
// Base configuration for an explosion object, excluding position and ID
const explosionPrefab: Omit<GameObjectConfig, 'id' | 'x' | 'y'> = {
    name: 'Explosion', // Base name, will be appended with ID
    type: 'effect',
    layerId: 'effects', // Use a dedicated layer if desired
    components: [
        { type: 'SpriteComponent', properties: {
            spriteRef: 'explosionSheet/frame1', // Initial frame (AnimationComponent will take over)
            anchor: { x: 0.5, y: 0.5 } // Center the explosion animation
        } },
        // AnimationComponent drives the visual change
        { type: 'AnimationComponent', properties: {
            defaultAnimation: 'exploding' // Matches the key in explosion1_def.json
            // assetLoader is injected by ObjectManager
        }},
        // ExplosionCompletionComponent handles cleanup after animation
        { type: 'ExplosionCompletionComponent', properties: {
            // objectManager is injected by ObjectManager
        }}
    ]
};

let explosionCounter = 0; // Simple counter for unique IDs

async function main() {
    if (!canvas) { updateStatus('Error: Canvas element not found!'); return; }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); }; document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext); }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const eventBus = new EventBus();
    const settingsManager = new SettingsManager();
    settingsManager.setEventBus(eventBus);
    await settingsManager.loadSettings(); // Load default/saved settings

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas, eventBus); // Listen on canvas
    const objectManager = new ObjectManager();
    objectManager.setAssetLoader(assetLoader);
    objectManager.setEventBus(eventBus);
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);
    // Ensure SoundManager uses the loaded settings
    const soundManager = new SoundManager(audioContext, assetLoader, settingsManager);

    // --- Register Components ---
    objectManager.registerComponent('AnimationComponent', AnimationComponent);
    objectManager.registerComponent('ExplosionCompletionComponent', ExplosionCompletionComponent); // Register the new component

    // --- Define Scene ---
    const demoScene: Scene = {
        id: 'animScene', name: 'Animation Demo Scene',
        layers: [
            { id: 'background', name: 'Background', depth: 0, visible: true },
            { id: 'effects', name: 'Effects', depth: 5, visible: true } // Layer for explosions
        ],
        objects: [] // Start with no objects
    };
    const demoProject: Project = { startScene: demoScene.name, scenes: { [demoScene.name]: demoScene } };

    // --- Load Assets ---
    try {
        updateStatus('Loading assets...');
        const manifest = await assetLoader.loadManifest('/assets/manifest.json');
        await assetLoader.loadAllAssets(manifest);
        updateStatus('Assets loaded.');
    } catch (error: any) { updateStatus(`Error loading assets: ${error.message}`); return; }

    // --- Setup Scene ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) { updateStatus('Error loading scene.'); return; }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) { updateStatus('Error getting current scene.'); return; }
    objectManager.createObjectsForScene(currentScene); // Create initial objects (none in this case)

    // --- Setup Event Listeners ---
    eventBus.subscribe('mouseDown', (event) => {
        const inputEvent = event as InputEvent;
        if (inputEvent.payload.button === 0) { // Check for left mouse button
            const clickX = inputEvent.payload.x;
            const clickY = inputEvent.payload.y;
            console.log(`Mouse down at (${clickX}, ${clickY}). Creating explosion.`);

            // Create a unique ID for the new explosion
            const explosionId = `explosion_${explosionCounter++}`;

            // Create the full config for this specific explosion instance
            const explosionConfig: GameObjectConfig = {
                ...explosionPrefab, // Spread the base prefab config
                id: explosionId,
                name: `Explosion ${explosionId}`,
                x: clickX,
                y: clickY,
            };

            // Create the explosion object
            const explosionObject = objectManager.createObjectFromConfig(explosionConfig);

            if (explosionObject) {
                // Play explosion sound
                soundManager.playSound('explosion');
                console.log(`Created ${explosionObject.name} at (${clickX}, ${clickY})`);
            } else {
                console.error(`Failed to create explosion object with config:`, explosionConfig);
            }
        }
    });

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);
    gameLoop.start();
    updateStatus('Animation Demo running. Click on the canvas.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => {
        gameLoop.stop();
        inputManager.destroy();
        eventBus.clearListeners(); // Clear listeners on unload
    });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
