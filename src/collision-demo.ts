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
        }}
        // NOTE: BulletMovementComponent is added dynamically later
    ]
};


async function main() {
    if (!canvas) { updateStatus('Error: Canvas element not found!'); return; }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try { /* ... audio context setup and resume ... */ audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); }; document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext); }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas);
    const objectManager = new ObjectManager();
    objectManager.setAssetLoader(assetLoader); // <<<<---- Set AssetLoader in ObjectManager
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);
    const soundManager = new SoundManager(audioContext, assetLoader); // Instantiate SoundManager
    const collisionSystem = new CollisionSystem(objectManager); // Instantiate CollisionSystem

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

    // --- Setup Scene & Collision Callbacks ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) { updateStatus('Error loading scene.'); return; }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) { updateStatus('Error getting current scene.'); return; }
    objectManager.createObjectsForScene(currentScene);

    // Add BulletMovementComponent dynamically AFTER objects are created
    // And set up collision callbacks
    for (const obj of Array.from(objectManager.getAllObjects())) {
        // Add BulletMovementComponent to bullets
        if (obj.type === 'bullet') {
            console.log(`Adding BulletMovementComponent to ${obj.name} (${obj.id})`);
            obj.addComponent(new BulletMovementComponent({
                speed: 400,
                objectManager: objectManager, // <<< Pass objectManager instance here
                bounds: { top: -20 }
            }));
        }

        // Setup collision handlers
        const collisionComp = obj.getComponent(CollisionComponent);
        if (collisionComp) {
            // Add explicit type IGameObject to otherObject
            collisionComp.onCollision = (otherObject: IGameObject) => {
                console.log(`Collision Handler: ${obj.name} hit ${otherObject.name}`);
                // Bullet hits Enemy
                if (collisionComp.group === 'bullet' && otherObject.getComponent(CollisionComponent)?.group === 'enemy') {
                    objectManager.destroyObject(obj.id); // Destroy bullet
                    objectManager.destroyObject(otherObject.id); // Destroy enemy
                    soundManager.playSound('explosion'); // Play explosion sound
                }
                // Enemy hits Player
                else if (collisionComp.group === 'enemy' && otherObject.getComponent(CollisionComponent)?.group === 'player') {
                    objectManager.destroyObject(obj.id); // Destroy enemy
                    soundManager.playSound('explosion');
                    updateStatus('Player hit by enemy!'); // Log player hit
                    // Could add player health logic here
                }
                 // Player hits Enemy (handled by the other object's collision)
                 else if (collisionComp.group === 'player' && otherObject.getComponent(CollisionComponent)?.group === 'enemy') {
                    objectManager.destroyObject(otherObject.id); // Destroy enemy
                    soundManager.playSound('explosion');
                    updateStatus('Player hit enemy!');
                 }
            };
        }
    }


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
    window.addEventListener('beforeunload', () => { gameLoop.stop(); inputManager.destroy(); });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
