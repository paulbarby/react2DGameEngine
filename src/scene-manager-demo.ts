import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene, GameObjectConfig } from './types/project.js';
import { SpriteComponent } from './core/components/SpriteComponent.js'; // For simple objects

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');
const loadScene1Button = document.getElementById('load-scene1-button');
const loadScene2Button = document.getElementById('load-scene2-button');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

async function main() {
    if (!canvas || !loadScene1Button || !loadScene2Button) {
        updateStatus('Error: HTML elements not found!');
        return;
    }
    updateStatus('Initializing...');

    // --- Core Systems ---
    // AudioContext setup (simplified)
    let audioContext: AudioContext;
    try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); /* ... resume logic ... */ }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas); // Input not used, but needed by GameLoop
    const objectManager = new ObjectManager();
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas); // Renderer doesn't need stars for this demo

    // --- Define Project with Multiple Scenes ---
    const scene1Objects: GameObjectConfig[] = [
        { id: 'obj1-s1', name: 'Red Square', type: 'shape', x: 100, y: 100, layerId: 'main',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'red', width: 50, height: 50 } }] }, // Placeholder spriteRef
        { id: 'obj2-s1', name: 'Blue Square', type: 'shape', x: 300, y: 200, layerId: 'main',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'blue', width: 50, height: 50 } }] } // Placeholder spriteRef
    ];
    const scene2Objects: GameObjectConfig[] = [
        { id: 'obj1-s2', name: 'Green Circle', type: 'shape', x: 400, y: 150, layerId: 'main',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'green', width: 60, height: 60 } }] }, // Placeholder spriteRef
        { id: 'obj2-s2', name: 'Yellow Circle', type: 'shape', x: 150, y: 250, layerId: 'main',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'yellow', width: 40, height: 40 } }] } // Placeholder spriteRef
    ];

    const scene1: Scene = {
        id: 'scene1', name: 'Scene 1',
        layers: [{ id: 'main', name: 'Main Layer', depth: 1, visible: true }],
        objects: scene1Objects
    };
    const scene2: Scene = {
        id: 'scene2', name: 'Scene 2',
        layers: [{ id: 'main', name: 'Main Layer', depth: 1, visible: true }],
        objects: scene2Objects
    };

    const demoProject: Project = {
        startScene: scene1.name, // Start with Scene 1
        scenes: {
            [scene1.name]: scene1,
            [scene2.name]: scene2
        }
    };

    // --- Load Assets (Minimal - just placeholders for SpriteComponent) ---
    // In a real scenario, load actual assets defined in manifest
    updateStatus('Loading minimal assets...');
    // No actual loading needed as we'll draw placeholders
    updateStatus('Assets loaded (placeholders).');

    // --- Setup Scene Manager ---
    sceneManager.loadProject(demoProject);

    // --- Function to Load and Activate a Scene ---
    function loadAndActivateScene(sceneName: string) {
        updateStatus(`Attempting to load scene: ${sceneName}...`);
        if (sceneManager.loadScene(sceneName)) {
            const currentScene = sceneManager.getCurrentScene();
            if (currentScene) {
                objectManager.createObjectsForScene(currentScene); // Create objects for the newly loaded scene
                updateStatus(`Scene "${sceneName}" loaded successfully.`);
            } else {
                updateStatus(`Error: Scene "${sceneName}" loaded but could not be retrieved.`);
            }
        } else {
            updateStatus(`Error: Failed to load scene "${sceneName}".`);
        }
    }

    // --- Initial Scene Load ---
    loadAndActivateScene(demoProject.startScene);

    // --- Button Event Listeners ---
    loadScene1Button.addEventListener('click', () => {
        loadAndActivateScene(scene1.name);
    });

    loadScene2Button.addEventListener('click', () => {
        loadAndActivateScene(scene2.name);
    });

    // --- Modify Renderer to Draw Placeholders ---
    // Override drawObject to draw simple colored rects based on spriteRef placeholder
    (renderer as any).drawObject = (object: any, assetLoader: AssetLoader) => {
        const ctx = (renderer as any).ctx;
        ctx.save();
        ctx.translate(object.x, object.y);
        // No rotation/scale for simplicity

        const spriteComp = object.getComponent(SpriteComponent);
        if (spriteComp) {
            const color = spriteComp.spriteRef || 'grey'; // Use spriteRef as color name
            const width = spriteComp.width || 30;
            const height = spriteComp.height || 30;
            const dx = -spriteComp.offsetX - width / 2; // Center origin
            const dy = -spriteComp.offsetY - height / 2;

            ctx.fillStyle = color;
            ctx.fillRect(dx, dy, width, height);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(dx, dy, width, height); // Add border
            // Draw name
            ctx.fillStyle = 'black';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(object.name, 0, 0);

        } else {
            ctx.fillStyle = 'grey';
            ctx.fillRect(-10, -10, 20, 20);
        }
        ctx.restore();
    };
     // Remove starfield drawing for this demo
    (renderer as any).drawStarfield = () => {};
    // Ensure renderScene uses the modified drawObject and doesn't need deltaTime for stars
     const originalRenderScene = renderer.renderScene;
     renderer.renderScene = (scene: Scene, objManager: ObjectManager, assetLdr: AssetLoader, deltaTime: number) => {
         const ctx = (renderer as any).ctx;
         ctx.fillStyle = '#e0e0e0'; // Light grey background
         ctx.fillRect(0, 0, renderer.viewportWidth, renderer.viewportHeight);

         const sortedLayers = [...scene.layers].sort((a, b) => a.depth - b.depth);
         for (const layer of sortedLayers) {
             if (!layer.visible) continue;
             const objects = objManager.getObjectsByLayer(layer.id);
             for (const object of objects) {
                 (renderer as any).drawObject(object, assetLdr); // Call the overridden drawObject
             }
         }
     };


    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    // GameLoop needs InputManager even if not used for movement here
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);
    gameLoop.start();
    updateStatus('Scene Manager Demo running. Use buttons to switch scenes.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => { gameLoop.stop(); inputManager.destroy(); });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
