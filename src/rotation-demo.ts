import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { EventBus } from './core/events/EventBus.js';
import { IGameObject } from './types/core.js';

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
    try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); const resumeContext = () => { if (audioContext.state === 'suspended') audioContext.resume().catch(e => console.error(e)); document.removeEventListener('click', resumeContext); document.removeEventListener('keydown', resumeContext); }; document.addEventListener('click', resumeContext); document.addEventListener('keydown', resumeContext); }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const eventBus = new EventBus();
    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas, eventBus);
    const objectManager = new ObjectManager();
    objectManager.setEventBus(eventBus);
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);

    // --- Define Scene ---
    const gameObjects: GameObjectConfig[] = [
        // Object 1: Simple Rotation
        {
            id: 'rotator1', name: 'Simple Rotator (Player)', type: 'demo',
            x: 150, y: 150, layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'playerSheet/idle', anchor: { x: 0.5, y: 0.5 } } }
            ]
        },
        // Object 2: Rotation + Scaling (Uniform)
        {
            id: 'scaler1', name: 'Uniform Scaler (Enemy)', type: 'demo',
            x: 400, y: 150, layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'enemySheet/idle', anchor: { x: 0.5, y: 0.5 } } }
            ]
        },
        // Object 3: Rotation + Non-Uniform Scaling
        {
            id: 'scaler2', name: 'Non-Uniform Scaler (Enemy2)', type: 'demo',
            x: 650, y: 150, layerId: 'main',
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'enemy2Sheet/idle', anchor: { x: 0.5, y: 0.5 } } }
            ]
        },
        // Object 4: Rotation + Pulsing Scale
        {
            id: 'pulser1', name: 'Pulsing Scaler (Bullet)', type: 'demo',
            x: 150, y: 400, layerId: 'main',
            components: [
                // Correct the spriteRef to point to a valid sprite name
                { type: 'SpriteComponent', properties: { spriteRef: 'bulletSheet/frame1', anchor: { x: 0.5, y: 0.5 } } }
            ]
        },
        // Object 5: Rotation around a point (by moving the object itself)
        {
            id: 'orbiter1', name: 'Orbiter (Player)', type: 'demo',
            x: 400, y: 400, layerId: 'main', // Center point
            components: [
                { type: 'SpriteComponent', properties: { spriteRef: 'playerSheet/thrust', anchor: { x: 0.5, y: 0.5 } } }
            ]
        }
    ];

    const demoScene: Scene = {
        id: 'rotScaleScene', name: 'Rotation/Scaling Demo Scene',
        layers: [{ id: 'main', name: 'Main', depth: 1, visible: true }],
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

    // --- Get Object References ---
    const rotator1 = objectManager.getObjectById('rotator1');
    const scaler1 = objectManager.getObjectById('scaler1');
    const scaler2 = objectManager.getObjectById('scaler2');
    const pulser1 = objectManager.getObjectById('pulser1');
    const orbiter1 = objectManager.getObjectById('orbiter1');

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);

    // --- Extend Game Loop for Custom Update Logic ---
    const originalLoop = (gameLoop as any).loop;
    let totalTime = 0; // Accumulate time for smooth animations

    (gameLoop as any).loop = (currentTime: number) => {
        // Calculate deltaTime (logic copied from GameLoop for access)
        let deltaTime = (currentTime - (gameLoop as any).lastTime) / 1000;
        const MAX_DELTA_TIME = 1 / 15;
        if (deltaTime > MAX_DELTA_TIME) {
            deltaTime = MAX_DELTA_TIME;
        }
        totalTime += deltaTime; // Accumulate total time

        // Call original loop (updates input, objects, renders)
        originalLoop(currentTime); // This now uses the potentially capped deltaTime

        // --- Custom Update Logic for Rotation/Scaling ---
        if (rotator1) {
            rotator1.rotation += 1.0 * deltaTime; // Radians per second
        }
        if (scaler1) {
            const scaleValue = 1.0 + Math.sin(totalTime * 1.5) * 0.5; // Scale between 0.5 and 1.5
            scaler1.scaleX = scaleValue;
            scaler1.scaleY = scaleValue;
            scaler1.rotation -= 0.8 * deltaTime;
        }
        if (scaler2) {
            scaler2.scaleX = 1.0 + Math.sin(totalTime * 2.0) * 0.7; // Scale X between 0.3 and 1.7
            scaler2.scaleY = 1.0 + Math.cos(totalTime * 2.0) * 0.7; // Scale Y between 0.3 and 1.7
            scaler2.rotation += 1.2 * deltaTime;
        }
        if (pulser1) {
            const pulseScale = 1.0 + (Math.sin(totalTime * 5.0) + 1) / 4; // Scale between 1.0 and 1.5 rapidly
            pulser1.scaleX = pulseScale;
            pulser1.scaleY = pulseScale;
            pulser1.rotation = totalTime * 3.0; // Spin faster
        }
        if (orbiter1) {
            const orbitRadius = 100;
            const orbitSpeed = 1.5; // Radians per second
            const orbitCenterX = 400;
            const orbitCenterY = 400;
            orbiter1.x = orbitCenterX + Math.cos(totalTime * orbitSpeed) * orbitRadius;
            orbiter1.y = orbitCenterY + Math.sin(totalTime * orbitSpeed) * orbitRadius;
            orbiter1.rotation = totalTime * orbitSpeed + Math.PI / 2; // Point along tangent
        }
        // --- End Custom Logic ---

        // RAF is handled by originalLoop's call within itself
    };

    gameLoop.start();
    updateStatus('Rotation & Scaling Demo running.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => {
        gameLoop.stop();
        inputManager.destroy();
        eventBus.clearListeners();
    });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
