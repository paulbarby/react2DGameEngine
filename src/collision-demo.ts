import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { SoundManager } from './core/sound/SoundManager.js'; // Import SoundManager
import { GameLoop } from './core/engine/GameLoop.js';
import { CollisionSystem } from './core/collision/CollisionSystem.js'; // Import CollisionSystem
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { PlayerControllerComponent } from './core/components/PlayerControllerComponent.js';
import { EnemyMovementComponent } from './core/components/EnemyMovementComponent.js';
import { CollisionComponent } from './core/components/CollisionComponent.js';
import { PlayerShootingComponent } from './core/components/PlayerShootingComponent.js';
import { BulletMovementComponent } from './core/components/BulletMovementComponent.js';
import { AnimationComponent } from './core/components/AnimationComponent.js'; // Import AnimationComponent
import { IGameObject } from './types/core.js'; // Import IGameObject
import { SettingsManager } from './core/settings/SettingsManager.js'; // Import SettingsManager
import { EventBus } from './core/events/EventBus.js'; // Import EventBus
import { AppEvent, CollisionEvent, GameObjectEvent } from './core/events/EventTypes.js'; // Import event types

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

// --- Bullet Prefab ---
const bulletPrefab: Omit<GameObjectConfig, 'id' | 'x' | 'y'> = {
    name: 'Bullet',
    type: 'bullet',
    layerId: 'main',
    components: [
        // SpriteComponent now just needs the sheet key, animation component handles frames
        { type: 'SpriteComponent', properties: {
            spriteRef: 'bulletSheet/frame1', // Initial frame reference (optional, AnimationComponent overrides)
            anchor: { x: 0.5, y: 0.5 }
        } },
        { type: 'CollisionComponent', properties: {
            group: 'bullet',
            collidesWith: ['enemy']
        }},
        // Add AnimationComponent config - assetLoader will be passed dynamically
        { type: 'AnimationComponent', properties: {
            defaultAnimation: 'default' // Name matches the key in bullet1_def.json
        }},
        // Add BulletMovementComponent directly to the prefab
        // ObjectManager will inject 'objectManager' dependency
        { type: 'BulletMovementComponent', properties: {
            speed: 400,
            bounds: { top: -20 }
            // objectManager is injected by ObjectManager
        }}
    ]
};


async function main() {
    if (!canvas) { updateStatus('Error: Canvas element not found!'); return; }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try { /* ... audio context setup and resume ... */ audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); }; document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext); }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const eventBus = new EventBus(); // Instantiate EventBus

    const settingsManager = new SettingsManager(); // Instantiate
    settingsManager.setEventBus(eventBus); // Inject EventBus
    console.log("collision-demo: Calling settingsManager.loadSettings()...");
    const loadedSettings = await settingsManager.loadSettings(); // Wait and get settings
    console.log("collision-demo: settingsManager.loadSettings() finished.");

    if (!loadedSettings) {
        updateStatus("Error: Failed to load settings. Cannot initialize SoundManager.");
        // Decide if the demo should proceed without sound or stop
    }
    console.log("collision-demo: Settings loaded, proceeding to create SoundManager.");
    console.log(`collision-demo: Master volume from manager: ${settingsManager.getMasterVolume()}`);

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas, eventBus); // Inject EventBus
    const objectManager = new ObjectManager();
    objectManager.setAssetLoader(assetLoader); // <<<<---- Set AssetLoader in ObjectManager
    objectManager.setEventBus(eventBus); // Inject EventBus
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);
    const soundManager = new SoundManager(audioContext, assetLoader, settingsManager); // Pass settingsManager to SoundManager
    const collisionSystem = new CollisionSystem(objectManager, assetLoader, eventBus); // Inject EventBus

    // --- Register Components ---
    objectManager.registerComponent('PlayerControllerComponent', PlayerControllerComponent);
    objectManager.registerComponent('EnemyMovementComponent', EnemyMovementComponent);
    objectManager.registerComponent('CollisionComponent', CollisionComponent);
    objectManager.registerComponent('PlayerShootingComponent', PlayerShootingComponent);
    objectManager.registerComponent('BulletMovementComponent', BulletMovementComponent);
    objectManager.registerComponent('AnimationComponent', AnimationComponent); // Register AnimationComponent

    // --- Define Scene ---
    const gameObjects: GameObjectConfig[] = [];

    // Player
    gameObjects.push({
        id: 'player', name: 'Player', type: 'player',
        x: canvas.width / 2, y: canvas.height - 100, layerId: 'main',
        components: [
            { type: 'SpriteComponent', properties: { spriteRef: 'playerSheet/idle', anchor: { x: 0.5, y: 0.5 } } },
            { type: 'PlayerControllerComponent', properties: { speed: 250, inputManager: inputManager, bounds: { width: canvas.width, height: canvas.height } } },
            { type: 'PlayerShootingComponent', properties: {
                inputManager: inputManager,
                objectManager: objectManager,
                soundManager: soundManager, // Pass SoundManager
                bulletPrefab: bulletPrefab, // <<<<---- Prefab is passed here
                fireRate: 5, // Bullets per second
                bulletOffsetY: -40 // Fire from slightly above center
            }},
            { type: 'CollisionComponent', properties: {
                group: 'player',
                collidesWith: ['enemy'] // Player collides with enemies
            }}
        ]
    });

    // Enemies (using enemy2 sprite)
    const numEnemies = 8;
    for (let i = 0; i < numEnemies; i++) {
        gameObjects.push({
            id: `enemy_${i}`, name: `Enemy ${i}`, type: 'enemy',
            x: Math.random() * canvas.width, y: Math.random() * canvas.height / 3, // Start near top
            layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'enemy2Sheet/idle', anchor: { x: 0.5, y: 0.5 } } },
                { type: 'EnemyMovementComponent', properties: { speed: 40 + Math.random() * 60, bounds: { width: canvas.width, height: canvas.height } } },
                { type: 'CollisionComponent', properties: {
                    group: 'enemy',
                    collidesWith: ['player', 'bullet'] // Enemies collide with player and bullets
                }}
            ]
        });
    }

    const demoScene: Scene = {
        id: 'collisionScene', name: 'Collision Demo Scene',
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
    objectManager.createObjectsForScene(currentScene); // This will now publish gameObjectCreated events

    // --- Setup Event Listeners (Replaces Collision Callbacks) ---
    eventBus.subscribe('collisionDetected', (event) => {
        const collisionEvent = event as CollisionEvent; // Type assertion
        const objA = collisionEvent.objectA;
        const objB = collisionEvent.objectB;

        // Ensure objects still exist before processing collision
        if (!objectManager.getObjectById(objA.id) || !objectManager.getObjectById(objB.id)) {
            console.log(`Collision event ignored: One or both objects destroyed (${objA.name}, ${objB.name})`);
            return;
        }

        const compA = objA.getComponent(CollisionComponent);
        const compB = objB.getComponent(CollisionComponent);

        // Should not happen if CollisionSystem filters correctly, but good practice
        if (!compA || !compB) {
            console.warn(`Collision event ignored: Missing CollisionComponent on ${compA ? objB.name : objA.name}`);
            return;
        }

        console.log(`EventBus Handler: Collision detected between ${objA.name} (Group: ${compA.group}) and ${objB.name} (Group: ${compB.group})`);

        // Case 1: Enemy hits Bullet (or vice versa)
        if ((compA.group === 'enemy' && compB.group === 'bullet') || (compA.group === 'bullet' && compB.group === 'enemy')) {
            console.log(` -> Enemy/Bullet collision. Destroying both.`);
            // Destroy both, checking existence before each destruction
            if (objectManager.getObjectById(objA.id)) objectManager.destroyObject(objA.id);
            if (objectManager.getObjectById(objB.id)) objectManager.destroyObject(objB.id);
            // Sound is handled by the 'gameObjectDestroyed' listener below
        }
        // Case 2: Enemy hits Player (or vice versa)
        else if ((compA.group === 'enemy' && compB.group === 'player') || (compA.group === 'player' && compB.group === 'enemy')) {
            const enemyObj = compA.group === 'enemy' ? objA : objB;
            console.log(` -> Player/Enemy collision. Destroying enemy: ${enemyObj.name}`);
            if (objectManager.getObjectById(enemyObj.id)) objectManager.destroyObject(enemyObj.id);
            updateStatus('Player hit by enemy!');
            // Sound is handled by the 'gameObjectDestroyed' listener below
        }
    });

    // Listener for object destruction (e.g., play explosion sound)
    eventBus.subscribe('gameObjectDestroyed', (event) => {
        const destroyedEvent = event as GameObjectEvent;
        const obj = destroyedEvent.gameObject;
        const collisionComp = obj.getComponent(CollisionComponent); // Check if it's something that should explode

        // Play explosion sound if an enemy or bullet was destroyed
        if (collisionComp && (collisionComp.group === 'enemy' || collisionComp.group === 'bullet')) {
            console.log(`EventBus Handler: Playing explosion sound for destroyed ${obj.name} (Group: ${collisionComp.group})`);
            soundManager.playSound('explosion');
        }
    });

    // --- REMOVE OLD COLLISION CALLBACK SETUP ---
    // // Setup collision callbacks for initially created objects (player, enemies)
    //  for (const obj of Array.from(objectManager.getAllObjects())) {
    //      const collisionComp = obj.getComponent(CollisionComponent);
    //      if (collisionComp) {
    //          collisionComp.onCollision = (otherObject: IGameObject) => {
    //              // ... old callback logic ...
    //          };
    //      }
    //  }
    // --- END REMOVE OLD COLLISION CALLBACK SETUP ---


    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);

    // --- Extend Game Loop to include CollisionSystem update ---
    const originalLoop = (gameLoop as any).loop;
    (gameLoop as any).loop = (currentTime: number) => {
        // Call original loop (updates input, objects, renders)
        originalLoop(currentTime);

        // --- Custom Logic: Update Collision System ---
        collisionSystem.update(); // Check for collisions AFTER objects have moved
        // --- End Custom Logic ---

        // RAF is handled by originalLoop
    };

    gameLoop.start();
    updateStatus('Game running. Use Arrows/WASD to move, Space to shoot.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => {
        gameLoop.stop();
        inputManager.destroy();
        eventBus.clearListeners(); // Clear listeners on unload
    });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
