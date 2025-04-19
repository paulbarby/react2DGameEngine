import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene, GameObjectConfig } from './types/project.js';
// Import NEW components
import { PlayerControllerComponent } from './core/components/PlayerControllerComponent.js';
import { EnemyMovementComponent } from './core/components/EnemyMovementComponent.js';
import { EventBus } from './core/events/EventBus.js'; // Import EventBus
import { SoundManager } from './core/sound/SoundManager.js'; // Import SoundManager (needed for ObjectManager)
import { SettingsManager } from './core/settings/SettingsManager.js'; // Import SettingsManager (needed for SoundManager)

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

async function main() {
    if (!canvas) {
        updateStatus('Error: Canvas element not found!');
        return;
    }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const resumeContext = () => { /* ... resume logic ... */ if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); };
        document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext);
    } catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const eventBus = new EventBus(); // Create EventBus instance
    const settingsManager = new SettingsManager(); // Needed for SoundManager
    settingsManager.setEventBus(eventBus);
    await settingsManager.loadSettings();

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas, eventBus); // Pass EventBus instance
    const objectManager = new ObjectManager();
    objectManager.setAssetLoader(assetLoader); // Set AssetLoader
    objectManager.setEventBus(eventBus); // Set EventBus
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas); // Renderer now handles stars
    const soundManager = new SoundManager(audioContext, assetLoader, settingsManager); // Create SoundManager
    objectManager.setSoundManager(soundManager); // Inject SoundManager
    objectManager.setInputManager(inputManager); // Inject InputManager

    // --- Register Custom Components ---
    objectManager.registerComponent('PlayerControllerComponent', PlayerControllerComponent);
    objectManager.registerComponent('EnemyMovementComponent', EnemyMovementComponent);

    // --- Define Scene ---
    const gameObjects: GameObjectConfig[] = [];

    // Player
    gameObjects.push({
        id: 'player', name: 'Player', type: 'player',
        x: canvas.width / 2, y: canvas.height - 100, layerId: 'main',
        components: [
            { type: 'SpriteComponent', properties: {
                spriteRef: 'playerSheet/idle',
                anchor: { x: 0.5, y: 0.5 } // Set anchor to center
            } },
            { type: 'PlayerControllerComponent', properties: {
                speed: 250,
                // inputManager: inputManager, // Removed: Injected by ObjectManager
                bounds: { width: canvas.width, height: canvas.height }
            }}
        ]
    });

    // Enemies
    const numEnemies = 8; // Increased enemy count slightly
    const enemySpriteRefs = ['enemySheet/idle', 'enemy2Sheet/idle']; // Array of possible sprite refs

    for (let i = 0; i < numEnemies; i++) {
        const randomSpriteRef = enemySpriteRefs[Math.floor(Math.random() * enemySpriteRefs.length)]; // Pick one randomly
        const enemyType = randomSpriteRef.startsWith('enemy2') ? 'enemy2' : 'enemy1'; // Determine type for potential logic differences

        gameObjects.push({
            id: `enemy_${i}`,
            name: `Enemy ${i} (${enemyType})`, // Add type to name for clarity
            type: 'enemy', // Keep generic type or use enemyType if needed
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2, // Start scattered
            layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: {
                    spriteRef: randomSpriteRef, // Use the randomly selected sprite reference
                    anchor: { x: 0.5, y: 0.5 }
                } },
                { type: 'EnemyMovementComponent', properties: {
                    // Optionally adjust speed based on type
                    speed: (enemyType === 'enemy2' ? 40 : 50) + Math.random() * 50,
                    bounds: { width: canvas.width, height: canvas.height }
                }}
            ]
        });
    }

    const demoScene: Scene = {
        id: 'advScene', name: 'Advanced Demo Scene',
        layers: [
            { id: 'background', name: 'Background', depth: 0, visible: true }, // For stars (drawn by renderer)
            { id: 'main', name: 'Main', depth: 1, visible: true }, // For ships
        ],
        objects: gameObjects
    };
    const demoProject: Project = {
        startScene: demoScene.name,
        scenes: { [demoScene.name]: demoScene }
    };

    // --- Load Assets ---
    const manifestUrl = '/assets/manifest.json';
    try {
        updateStatus('Loading assets...');
        const manifest = await assetLoader.loadManifest(manifestUrl);
        await assetLoader.loadAllAssets(manifest);
        updateStatus('Assets loaded.');
    } catch (error: any) { updateStatus(`Error loading assets: ${error.message}`); return; }

    // --- Setup Scene ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) { updateStatus('Error loading scene.'); return; }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) { updateStatus('Error getting current scene.'); return; }
    objectManager.createObjectsForScene(currentScene);

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);
    gameLoop.start();
    updateStatus('Game running. Use Arrows/WASD.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => { gameLoop.stop(); inputManager.destroy(); });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
