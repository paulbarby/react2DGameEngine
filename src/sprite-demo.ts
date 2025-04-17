import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { SoundManager } from './core/sound/SoundManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene } from './types/project.js';
import { IGameObject } from './types/core.js';
import { SpriteComponent } from './core/components/SpriteComponent.js'; // Import SpriteComponent

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

// Define the constant here for use in the extended loop
const MAX_DELTA_TIME = 1 / 15; // Cap delta time to avoid large jumps

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

async function main() {
    if (!canvas) {
        updateStatus('Error: Canvas element not found!');
        return;
    }

    updateStatus('Initializing engine components...');

    // --- Instantiate Core Systems ---
    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
         // Resume context on interaction
        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(e => console.error(`AudioContext resume failed: ${e}`));
            }
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
    const inputManager = new InputManager(canvas); // Target input to canvas
    const objectManager = new ObjectManager(); // Will auto-register SpriteComponent
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas);
    const soundManager = new SoundManager(audioContext, assetLoader); // SoundManager needed but not used in this demo

    // --- Define a Simple Project/Scene ---
    // Usually loaded from JSON, but defined inline for this demo
    const demoScene: Scene = {
        id: 'scene1',
        name: 'Demo Scene',
        layers: [
            { id: 'layer1', name: 'Background', depth: 0, visible: true },
            { id: 'layer2', name: 'Main', depth: 1, visible: true },
        ],
        objects: [
            {
                id: 'player1',
                name: 'Player Sprite',
                type: 'sprite', // Generic type
                x: canvas.width / 2,
                y: canvas.height / 2,
                layerId: 'layer2',
                components: [
                    {
                        type: 'SpriteComponent', // Must match registered name in ObjectManager
                        properties: {
                            spriteRef: 'playerSheet/idle', // Sheet key / sprite name
                            // Optional: override size/offset if needed
                            // width: 64,
                            // height: 64,
                            // offsetX: 32, // Center origin example
                            // offsetY: 32,
                        }
                    }
                ]
            }
        ]
    };
    const demoProject: Project = {
        startScene: 'Demo Scene', // Scene name matches key below
        scenes: {
            'Demo Scene': demoScene
        }
    };

    // --- Load Assets ---
    const manifestUrl = '/assets/manifest.json';
    try {
        updateStatus(`Loading manifest from ${manifestUrl}...`);
        const manifest = await assetLoader.loadManifest(manifestUrl);
        updateStatus('Loading all assets...');
        await assetLoader.loadAllAssets(manifest);
        updateStatus('Assets loaded.');
    } catch (error: any) {
        updateStatus(`Error loading assets: ${error.message}`);
        return;
    }

    // --- Setup Scene ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) {
         updateStatus(`Error: Failed to load start scene "${demoProject.startScene}"`);
         return;
    }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) {
         updateStatus(`Error: Current scene is null after loading.`);
         return;
    }
    objectManager.createObjectsForScene(currentScene);

    // --- Get Player Object for Input Control ---
    const playerObject = objectManager.getObjectById('player1');
    if (!playerObject) {
        updateStatus('Error: Player object not found after creation.');
        return;
    }

    // --- Create and Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(
        objectManager,
        renderer,
        sceneManager,
        inputManager,
        assetLoader
        // soundManager // Pass if GameLoop needs it
    );

    // --- Add Custom Update Logic (e.g., Input Handling) ---
    const originalLoop = (gameLoop as any).loop; // Access private loop for extension
    let lastDeltaTime = 1 / 60; // Initialize delta time estimate
    let frameCount = 0; // Add frame counter for logging

    (gameLoop as any).loop = (currentTime: number) => {
        frameCount++;
        // console.log(`--- Frame ${frameCount} ---`); // Log frame start

        // --- Calculate Delta Time ---
        let deltaTime = (currentTime - (gameLoop as any).lastTime) / 1000;
        (gameLoop as any).lastTime = currentTime;

        if (deltaTime > MAX_DELTA_TIME) {
            // console.log(`Delta time capped from ${deltaTime.toFixed(4)}s`);
            deltaTime = MAX_DELTA_TIME;
        }
        lastDeltaTime = deltaTime;
        // console.log(`DeltaTime: ${deltaTime.toFixed(4)}s`);

        // --- Original Loop Logic (Input Update, Object Update, Render) ---
        inputManager.update();
        objectManager.update(deltaTime);
        const currentScene = sceneManager.getCurrentScene();
        if (currentScene) {
            // Pass deltaTime to renderScene
            renderer.renderScene(currentScene, objectManager, assetLoader, deltaTime);
        } else {
             renderer.resize(renderer.viewportWidth, renderer.viewportHeight);
        }
        // --- End Original Loop Logic ---


        // --- Custom Logic (Input Handling for Player) ---
        const speed = 150;
        let dx = 0;
        let dy = 0;
        // ... input checking ...
        if (inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA')) dx -= 1;
        if (inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD')) dx += 1;
        if (inputManager.isKeyDown('ArrowUp') || inputManager.isKeyDown('KeyW')) dy -= 1;
        if (inputManager.isKeyDown('ArrowDown') || inputManager.isKeyDown('KeyS')) dy += 1;

        // Only log if there's input (UNCOMMENTED)
        if (dx !== 0 || dy !== 0) {
            console.log(`Input: dx=${dx}, dy=${dy}`);
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx = (dx / len);
            dy = (dy / len);
        }

        const oldX = playerObject.x;
        const oldY = playerObject.y;
        playerObject.x += dx * speed * lastDeltaTime;
        playerObject.y += dy * speed * lastDeltaTime;

        // Log position change only if moved (UNCOMMENTED)
        if (playerObject.x !== oldX || playerObject.y !== oldY) {
            console.log(`Player Pos: (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) -> (${playerObject.x.toFixed(1)}, ${playerObject.y.toFixed(1)})`);
        }

        const spriteComp = playerObject.getComponent(SpriteComponent);
        // Log spriteComp details once or periodically
        // if (frameCount % 60 === 1) { // Log every 60 frames
        //     console.log('SpriteComp:', spriteComp ? `Found (w:${spriteComp.width}, h:${spriteComp.height})` : 'Not Found');
        // }

        const halfWidth = (spriteComp?.width || 32) / 2;
        const halfHeight = (spriteComp?.height || 32) / 2;
        playerObject.x = Math.max(halfWidth, Math.min(canvas.width - halfWidth, playerObject.x));
        playerObject.y = Math.max(halfHeight, Math.min(canvas.height - halfHeight, playerObject.y));
        // --- End Custom Logic ---


        // Request the next frame
        if ((gameLoop as any).isRunning) {
             (gameLoop as any).rafId = requestAnimationFrame((gameLoop as any).loop);
        }
    };

    gameLoop.start();
    updateStatus('Game loop running. Use arrow keys to move.');

     // Optional: Cleanup on window unload
    window.addEventListener('beforeunload', () => {
        gameLoop.stop();
        inputManager.destroy();
        // Potentially other cleanup
    });
}

// Run the main function
main().catch(err => {
    updateStatus(`Unhandled error: ${err.message}`);
    console.error(err);
});
