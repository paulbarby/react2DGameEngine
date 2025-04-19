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
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { PlayerControllerComponent } from './core/components/PlayerControllerComponent.js';
import { CollisionComponent } from './core/components/CollisionComponent.js';
import { AnimationComponent } from './core/components/AnimationComponent.js';
import { BehaviorStrategyComponent } from './core/components/BehaviorStrategyComponent.js'; // Import
import { AIControllerComponent } from './core/components/AIControllerComponent.js'; // Import
import { createGameplayEvent, GameplayEvent } from './core/events/EventTypes.js'; // Import GameplayEvent

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

async function main() {
    if (!canvas) { updateStatus('Error: Canvas element not found!'); return; }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try { /* ... audio context setup ... */ audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); }; document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext); }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

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
    objectManager.setSoundManager(soundManager); // Pass sound manager for dependencies
    objectManager.setInputManager(inputManager); // Pass input manager for dependencies
    const collisionSystem = new CollisionSystem(objectManager, assetLoader, eventBus);

    // --- Define Scene ---
    const gameObjects: GameObjectConfig[] = [];

    // Player (Target for AI)
    gameObjects.push({
        id: 'player', name: 'Player', type: 'player', // Type 'player' is used by AIControllerComponent targetTag
        x: canvas.width / 2, y: canvas.height - 100, layerId: 'main',
        components: [
            { type: 'SpriteComponent', properties: { spriteRef: 'playerSheet/idle', anchor: { x: 0.5, y: 0.5 } } },
            { type: 'PlayerControllerComponent', properties: { speed: 250, bounds: { width: canvas.width, height: canvas.height } } }, // inputManager injected by ObjectManager
            { type: 'CollisionComponent', properties: { group: 'player', collidesWith: ['enemy'] } } // Player can be hit by enemies
        ]
    });

    // AI Enemy using Behavior Strategies
    gameObjects.push({
        id: 'ai_enemy_1', name: 'AI Enemy', type: 'enemy',
        x: 150, y: 150, layerId: 'main',
        components: [
            // Visuals and Basic Collision
            { type: 'SpriteComponent', properties: {
                spriteRef: 'enemy2Sheet/idle', // Use enemy2 sprite
                anchor: { x: 0.5, y: 0.5 }
            }},
            { type: 'CollisionComponent', properties: {
                group: 'enemy',
                collidesWith: ['player'] // Can collide with player
            }},
            // Animation (requires definitions in enemy2_def.json for 'idle', 'walk', 'run', 'attack')
            { type: 'AnimationComponent', properties: {
                // assetLoader is injected by ObjectManager
                defaultAnimation: 'idle' // Start with idle animation
            }},
            // Behavior Strategy Core
            { type: 'BehaviorStrategyComponent', properties: {
                // dependencies and factory are injected by ObjectManager
                initialStrategyKey: 'wander', // Start wandering
                initialStrategyConfig: { // Config for the initial 'wander' strategy
                    speed: 60,
                    wanderRadius: 100,
                    changeTargetInterval: 2.5,
                    animationName: 'walk', // Animation to play while wandering
                    bounds: { width: canvas.width, height: canvas.height }
                }
            }},
            // AI Controller to Switch Strategies
            { type: 'AIControllerComponent', properties: {
                // dependencies (objectManager, eventBus etc.) are injected by ObjectManager
                targetTag: 'player', // Target objects with type 'player'
                detectionRadius: 250, // Start chasing when player is within this distance
                attackRange: 70,      // Start attacking when player is within this distance
                loseTargetDistance: 350, // Stop chasing/attacking if player gets further than this

                // Provide configs for the strategies the controller might switch TO
                idleConfig: { animationName: 'idle' },
                wanderConfig: { // Config passed when switching back to wander
                    speed: 60,
                    wanderRadius: 100,
                    changeTargetInterval: 2.5,
                    animationName: 'walk',
                    bounds: { width: canvas.width, height: canvas.height }
                },
                chaseConfig: { // Config passed when switching to chase
                    speed: 110,
                    stoppingDistance: 60, // Stop slightly before attack range
                    animationName: 'run' // Animation for chasing
                    // targetId is set dynamically by AIControllerComponent
                    // loseTargetDistance is set dynamically by AIControllerComponent
                },
                attackConfig: { // Config passed when switching to attack
                    attackInterval: 1.2,
                    attackRange: 70, // Must match controller's attackRange
                    animationName: 'attack', // Animation for attacking
                    attackEventName: 'enemyAttack' // Event to fire
                    // targetId is set dynamically by AIControllerComponent
                }
            }}
        ]
    });

    const demoScene: Scene = {
        id: 'behaviorScene', name: 'Behavior Strategy Demo Scene',
        layers: [{ id: 'main', name: 'Main', depth: 1, visible: true }],
        objects: gameObjects
    };
    const demoProject: Project = { startScene: demoScene.name, scenes: { [demoScene.name]: demoScene } };

    // --- Load Assets ---
    try { /* ... asset loading ... */ updateStatus('Loading assets...'); const manifest = await assetLoader.loadManifest('/assets/manifest.json'); await assetLoader.loadAllAssets(manifest); updateStatus('Assets loaded.'); }
    catch (error: any) { updateStatus(`Error loading assets: ${error.message}`); return; }

    // --- Setup Scene ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) { updateStatus('Error loading scene.'); return; }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) { updateStatus('Error getting current scene.'); return; }
    objectManager.createObjectsForScene(currentScene);

    // --- Event Listeners (Example: Handle Attack Event) ---
    eventBus.subscribe('enemyAttack', (event) => {
        const attackEvent = event as GameplayEvent; // Cast to GameplayEvent
        // Check payload exists before accessing (good practice)
        if (attackEvent.payload) {
            console.log(`EventBus Handler: Enemy attack event received! Attacker: ${attackEvent.payload.attackerId}, Target: ${attackEvent.payload.targetId}`);
            // In a real game, check distance, line of sight, and deal damage here
            soundManager.playSound('laserShoot'); // Play a sound for the attack action
        } else {
            console.warn('Received enemyAttack event without payload:', attackEvent);
        }
    });

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);

    // Extend loop to include CollisionSystem update
    const originalLoop = (gameLoop as any).loop;
    (gameLoop as any).loop = (currentTime: number) => {
        originalLoop(currentTime); // Input, Object Update, Render
        collisionSystem.update(); // Collision checks
    };

    gameLoop.start();
    updateStatus('Game running. Move player near enemy.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => { gameLoop.stop(); inputManager.destroy(); eventBus.clearListeners(); });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
