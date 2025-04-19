// --- Import Core Engine Classes ---
import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { SoundManager } from './core/sound/SoundManager.js';
import { SettingsManager } from './core/settings/SettingsManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { CollisionSystem } from './core/collision/CollisionSystem.js';
import { EventBus } from './core/events/EventBus.js';

// --- Import Types ---
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { AppEvent, CollisionEvent, GameObjectEvent } from './core/events/EventTypes.js'; // Import event types

// --- Import Components ---
import { PlayerControllerComponent } from './core/components/PlayerControllerComponent.js';
import { EnemyMovementComponent } from './core/components/EnemyMovementComponent.js';
import { CollisionComponent } from './core/components/CollisionComponent.js';
import { PlayerShootingComponent } from './core/components/PlayerShootingComponent.js';
import { BulletMovementComponent } from './core/components/BulletMovementComponent.js';
// Import other components if needed (e.g., SpriteComponent is usually implicitly needed)
import { SpriteComponent } from './core/components/SpriteComponent.js';
import { AnimationComponent } from './core/components/AnimationComponent.js'; // Needed for bullet animation

// --- Get Canvas and Status Element ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status'); // Assuming a status element exists in the corresponding HTML

// --- Status Update Function ---
function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

console.log('InputManager test script loaded.');

const keysDownEl = document.getElementById('keys-down');
const mousePosEl = document.getElementById('mouse-pos');
const mouseButtonsEl = document.getElementById('mouse-buttons');
const targetEl = document.getElementById('target');
const mouseDisplayEl = document.getElementById('mouse-display');

if (!keysDownEl || !mousePosEl || !mouseButtonsEl || !targetEl || !mouseDisplayEl) {
    console.error('Required HTML elements not found!');
} else {
    // Instantiate InputManager, targeting the blue box
    const eventBus = new EventBus(); // Create EventBus instance
    const inputManager = new InputManager(targetEl, eventBus); // Pass EventBus instance

    // Function to update the display
    function updateDisplay() {
        // Keys Down
        const keys = Array.from((inputManager as any).keysDown); // Access private for demo
        keysDownEl!.textContent = JSON.stringify(keys);

        // Mouse Position
        const mousePos = inputManager.getMousePosition();
        mousePosEl!.textContent = `x: ${mousePos.x.toFixed(0)}, y: ${mousePos.y.toFixed(0)}`;
        mouseDisplayEl!.textContent = `Mouse Pos: ${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)}`;
        mouseDisplayEl!.style.left = `${mousePos.x}px`;
        mouseDisplayEl!.style.top = `${mousePos.y}px`;


        // Mouse Buttons Down
        const buttons = Array.from((inputManager as any).mouseButtonsDown); // Access private for demo
        mouseButtonsEl!.textContent = JSON.stringify(buttons);

        // Call update on InputManager (though it doesn't do much in this version)
        inputManager.update();

        // Request next frame
        requestAnimationFrame(updateDisplay);
    }

    // Start the display loop
    requestAnimationFrame(updateDisplay);

    console.log('InputManager instantiated and display loop started.');

    // Optional: Cleanup on window unload
    window.addEventListener('beforeunload', () => {
        inputManager.destroy();
    });
}

async function main() {
    if (!canvas) { updateStatus('Error: Canvas element not found!'); return; } // Check canvas
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); };
        document.addEventListener('click', resumeContext);
        document.addEventListener('keydown', resumeContext);
    } catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const eventBus = new EventBus();
    const settingsManager = new SettingsManager();
    settingsManager.setEventBus(eventBus);
    await settingsManager.loadSettings();

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas, eventBus);
    const objectManager = new ObjectManager();
    objectManager.setAssetLoader(assetLoader);
    objectManager.setEventBus(eventBus);
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);
    const soundManager = new SoundManager(audioContext, assetLoader, settingsManager);
    objectManager.setSoundManager(soundManager); // Inject SoundManager
    objectManager.setInputManager(inputManager); // Inject InputManager
    const collisionSystem = new CollisionSystem(objectManager, assetLoader, eventBus);

    // --- Register Custom Components ---
    // ObjectManager might already register built-ins, but explicit registration is safer
    objectManager.registerComponent('SpriteComponent', SpriteComponent); // Ensure SpriteComponent is registered
    objectManager.registerComponent('PlayerControllerComponent', PlayerControllerComponent);
    objectManager.registerComponent('EnemyMovementComponent', EnemyMovementComponent);
    objectManager.registerComponent('CollisionComponent', CollisionComponent);
    objectManager.registerComponent('PlayerShootingComponent', PlayerShootingComponent);
    objectManager.registerComponent('BulletMovementComponent', BulletMovementComponent);
    objectManager.registerComponent('AnimationComponent', AnimationComponent); // Register AnimationComponent

    // --- Define Bullet Prefab ---
    const bulletPrefab: Omit<GameObjectConfig, 'id' | 'x' | 'y'> = {
        name: 'Bullet', type: 'bullet', layerId: 'main',
        components: [
            { type: 'SpriteComponent', properties: { spriteRef: 'bulletSheet/frame1', anchor: { x: 0.5, y: 0.5 } } },
            { type: 'AnimationComponent', properties: { defaultAnimation: 'default' } }, // Add animation
            { type: 'BulletMovementComponent', properties: { speed: 400, directionY: -1, bounds: { top: -20 } } }, // Use 'top' bound
            { type: 'CollisionComponent', properties: { group: 'bullet', collidesWith: ['enemy'] } }
        ]
    };

    // --- Define Scene ---
    const gameObjects: GameObjectConfig[] = [];

    // Player
    gameObjects.push({
        id: 'player', name: 'Player', type: 'player',
        x: canvas.width / 2, y: canvas.height - 100, layerId: 'main',
        components: [
            { type: 'SpriteComponent', properties: { spriteRef: 'playerSheet/idle', anchor: { x: 0.5, y: 0.5 } } },
            { type: 'PlayerControllerComponent', properties: {
                speed: 250,
                // inputManager: inputManager, // Removed: Injected by ObjectManager
                bounds: { width: canvas.width, height: canvas.height }
            }},
            { type: 'CollisionComponent', properties: { group: 'player', collidesWith: ['enemy'] } },
            { type: 'PlayerShootingComponent', properties: {
                // inputManager: inputManager, // Removed: Injected by ObjectManager
                // objectManager: objectManager, // Removed: Injected by ObjectManager
                // soundManager: soundManager, // Removed: Injected by ObjectManager
                bulletPrefab: bulletPrefab,
                fireRate: 5,
                bulletOffsetY: -40 // Adjusted offset
            }}
        ]
    });

    // Enemies
    const numEnemies = 5;
    for (let i = 0; i < numEnemies; i++) {
        gameObjects.push({
            id: `enemy_${i}`, name: `Enemy ${i}`, type: 'enemy',
            x: Math.random() * canvas.width, y: Math.random() * canvas.height / 3,
            layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'enemySheet/idle', anchor: { x: 0.5, y: 0.5 } } },
                { type: 'EnemyMovementComponent', properties: { speed: 50 + Math.random() * 50, bounds: { width: canvas.width, height: canvas.height } } },
                { type: 'CollisionComponent', properties: { group: 'enemy', collidesWith: ['player', 'bullet'] } }
            ]
        });
    }

    const demoScene: Scene = {
        id: 'mainScene', name: 'Main Game Scene',
        layers: [{ id: 'main', name: 'Main Layer', depth: 1, visible: true }],
        objects: gameObjects
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
    objectManager.createObjectsForScene(currentScene);

    // --- Setup Event Listeners ---
    eventBus.subscribe('collisionDetected', (event) => {
        const collisionEvent = event as CollisionEvent;
        const objA = collisionEvent.objectA;
        const objB = collisionEvent.objectB;

        if (!objectManager.getObjectById(objA.id) || !objectManager.getObjectById(objB.id)) return;

        const compA = objA.getComponent(CollisionComponent);
        const compB = objB.getComponent(CollisionComponent);
        if (!compA || !compB) return;

        if ((compA.group === 'enemy' && compB.group === 'bullet') || (compA.group === 'bullet' && compB.group === 'enemy')) {
            if (objectManager.getObjectById(objA.id)) objectManager.destroyObject(objA.id);
            if (objectManager.getObjectById(objB.id)) objectManager.destroyObject(objB.id);
        } else if ((compA.group === 'enemy' && compB.group === 'player') || (compA.group === 'player' && compB.group === 'enemy')) {
            const enemyObj = compA.group === 'enemy' ? objA : objB;
            if (objectManager.getObjectById(enemyObj.id)) objectManager.destroyObject(enemyObj.id);
            updateStatus('Player hit!');
        }
    });

    eventBus.subscribe('gameObjectDestroyed', (event) => {
        const destroyedEvent = event as GameObjectEvent;
        const obj = destroyedEvent.gameObject;
        const collisionComp = obj.getComponent(CollisionComponent);
        if (collisionComp && (collisionComp.group === 'enemy' || collisionComp.group === 'bullet')) {
            soundManager.playSound('explosion');
        }
    });

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);

    // Extend loop to include CollisionSystem update
    const originalLoop = (gameLoop as any).loop;
    (gameLoop as any).loop = (currentTime: number) => {
        originalLoop(currentTime);
        collisionSystem.update();
    };

    gameLoop.start();
    updateStatus('Game running.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => {
        gameLoop.stop();
        inputManager.destroy();
        eventBus.clearListeners();
    });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
