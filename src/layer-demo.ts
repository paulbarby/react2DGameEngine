import { AssetLoader } from './core/assets/AssetLoader.js';
import { InputManager } from './core/input/InputManager.js';
import { ObjectManager } from './core/objects/ObjectManager.js';
import { Renderer } from './core/rendering/Renderer.js';
import { SceneManager } from './core/scene/SceneManager.js';
import { GameLoop } from './core/engine/GameLoop.js';
import { Project, Scene, GameObjectConfig, Layer } from './types/project.js';
import { SpriteComponent } from './core/components/SpriteComponent.js'; // For simple objects
import { IGameObject } from './types/core.js'; // Import IGameObject

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status');

function updateStatus(message: string) {
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

// Extend Layer type locally for this demo
interface ScrollableLayer extends Layer {
    scrollOffsetX: number;
    scrollOffsetY: number;
    parallaxFactor: number; // How much this layer scrolls relative to input (0=none, 1=full)
}

async function main() {
    if (!canvas) {
        updateStatus('Error: HTML elements not found!');
        return;
    }
    updateStatus('Initializing...');

    // --- Core Systems ---
    let audioContext: AudioContext;
    try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); /* ... resume logic ... */ }
    catch (e) { updateStatus('Error: Web Audio API not supported.'); return; }

    const assetLoader = new AssetLoader(audioContext);
    const inputManager = new InputManager(canvas);
    const objectManager = new ObjectManager();
    const sceneManager = new SceneManager();
    const renderer = new Renderer(canvas); // Use standard renderer

    // --- Define Project with One Scene, Multiple Layers ---
    // Add scroll offsets and parallax factors to layers
    const layers: ScrollableLayer[] = [
        { id: 'background', name: 'Background Layer', depth: 0, visible: true, scrollOffsetX: 0, scrollOffsetY: 0, parallaxFactor: 0.2 },
        { id: 'middle', name: 'Middle Layer', depth: 5, visible: true, scrollOffsetX: 0, scrollOffsetY: 0, parallaxFactor: 0.6 },
        { id: 'foreground', name: 'Foreground Layer', depth: 10, visible: true, scrollOffsetX: 0, scrollOffsetY: 0, parallaxFactor: 1.0 },
    ];

    const gameObjects: GameObjectConfig[] = [
        // Background Objects (Depth 0)
        { id: 'bg1', name: 'BG Large Blue', type: 'shape', x: canvas.width / 2, y: canvas.height / 2, layerId: 'background',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'lightblue', width: 300, height: 200, offsetX: 150, offsetY: 100 } }] },
        { id: 'bg2', name: 'BG Small Cyan', type: 'shape', x: 100, y: 100, layerId: 'background',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'cyan', width: 80, height: 80, offsetX: 40, offsetY: 40 } }] },

        // Middle Objects (Depth 5)
        { id: 'mid1', name: 'Mid Green', type: 'shape', x: canvas.width / 2 + 50, y: canvas.height / 2 - 30, layerId: 'middle',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'lime', width: 100, height: 100, offsetX: 50, offsetY: 50 } }] },
        { id: 'mid2', name: 'Mid Orange', type: 'shape', x: 200, y: 250, layerId: 'middle',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'orange', width: 70, height: 120, offsetX: 35, offsetY: 60 } }] },

        // Foreground Objects (Depth 10)
        { id: 'fg1', name: 'FG Red', type: 'shape', x: canvas.width / 2 - 80, y: canvas.height / 2 + 40, layerId: 'foreground',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'red', width: 60, height: 60, offsetX: 30, offsetY: 30 } }] },
        { id: 'fg2', name: 'FG Magenta', type: 'shape', x: 450, y: 120, layerId: 'foreground',
          components: [{ type: 'SpriteComponent', properties: { spriteRef: 'magenta', width: 50, height: 90, offsetX: 25, offsetY: 45 } }] },
    ];

    // Use the extended Layer type for the scene
    const demoScene: Scene & { layers: ScrollableLayer[] } = {
        id: 'layerScene', name: 'Layer Demo Scene',
        layers: layers,
        objects: gameObjects
    };

    const demoProject: Project = {
        startScene: demoScene.name,
        scenes: { [demoScene.name]: demoScene }
    };

    // --- Load Assets (Minimal Placeholders) ---
    updateStatus('Loading minimal assets...');
    updateStatus('Assets loaded (placeholders).');

    // --- Setup Scene Manager ---
    sceneManager.loadProject(demoProject);
    if (!sceneManager.loadScene(demoProject.startScene)) { updateStatus('Error loading scene.'); return; }
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) { updateStatus('Error getting current scene.'); return; }
    objectManager.createObjectsForScene(currentScene);

    // --- Modify Renderer for Placeholders and Parallax ---
    (renderer as any).drawObject = (object: IGameObject, assetLoader: AssetLoader) => { // Changed type to IGameObject
        const ctx = (renderer as any).ctx;
        // NOTE: Translation is now handled per-layer in renderScene override
        ctx.save();
        // Apply object's local transform relative to the (potentially scrolled) layer origin
        ctx.translate(object.x, object.y);

        const spriteComp = object.getComponent(SpriteComponent);
        if (spriteComp) {
            const color = spriteComp.spriteRef || 'grey';
            const width = spriteComp.width || 30;
            const height = spriteComp.height || 30;
            // Draw relative to object's origin (0,0) after translation
            const dx = -spriteComp.offsetX;
            const dy = -spriteComp.offsetY;

            ctx.globalAlpha = 0.85;
            ctx.fillStyle = color;
            ctx.fillRect(dx, dy, width, height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, width, height);

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'black';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const layer = sceneManager.getCurrentScene()?.layers.find(l => l.id === object.layerId); // This should now compile
            ctx.fillText(`${object.name} (L: ${layer?.name} D:${layer?.depth})`, dx + width / 2, dy + height / 2);

        } else { /* ... placeholder ... */ }
        ctx.restore(); // Restore from object's local transform
    };
    // Remove starfield for clarity
    (renderer as any).drawStarfield = () => {};

    // Override renderScene to apply layer scrolling
    renderer.renderScene = (scene: Scene, objManager: ObjectManager, assetLdr: AssetLoader, deltaTime: number) => {
        const ctx = (renderer as any).ctx;
        ctx.fillStyle = '#d3d3d3'; // Light grey background
        ctx.fillRect(0, 0, renderer.viewportWidth, renderer.viewportHeight);

        // Use the ScrollableLayer type here
        const sortedLayers = [...(scene.layers as ScrollableLayer[])].sort((a, b) => a.depth - b.depth);

        for (const layer of sortedLayers) {
            if (!layer.visible) continue;

            ctx.save(); // Save context state before applying layer transform

            // Apply layer scroll offset
            ctx.translate(layer.scrollOffsetX, layer.scrollOffsetY);

            const objects = objManager.getObjectsByLayer(layer.id);
            for (const object of objects) {
                // Draw object - drawObject now assumes context is already translated for the layer
                (renderer as any).drawObject(object, assetLdr);
            }

            ctx.restore(); // Restore context state, removing layer transform
        }
    };

    // --- Start Game Loop ---
    updateStatus('Starting Game Loop...');
    const gameLoop = new GameLoop(objectManager, renderer, sceneManager, inputManager, assetLoader);

    // --- Extend Game Loop for Input-based Scrolling ---
    const originalLoop = (gameLoop as any).loop;
    (gameLoop as any).loop = (currentTime: number) => {
        // Call the original loop logic first (calculates deltaTime, updates objects, renders)
        originalLoop(currentTime);

        // --- Custom Logic: Update Layer Scroll Offsets ---
        const scrollSpeed = 150; // Pixels per second at parallaxFactor 1.0
        const currentDeltaTime = (gameLoop as any).lastDeltaTime || (1/60); // Get deltaTime from loop if possible

        let scrollDx = 0;
        let scrollDy = 0;
        if (inputManager.isKeyDown('ArrowLeft')) scrollDx += 1;
        if (inputManager.isKeyDown('ArrowRight')) scrollDx -= 1;
        if (inputManager.isKeyDown('ArrowUp')) scrollDy += 1;
        if (inputManager.isKeyDown('ArrowDown')) scrollDy -= 1;

        if (scrollDx !== 0 || scrollDy !== 0) {
            const currentScene = sceneManager.getCurrentScene();
            if (currentScene) {
                // Iterate through the scrollable layers
                (currentScene.layers as ScrollableLayer[]).forEach(layer => {
                    layer.scrollOffsetX += scrollDx * scrollSpeed * layer.parallaxFactor * currentDeltaTime;
                    layer.scrollOffsetY += scrollDy * scrollSpeed * layer.parallaxFactor * currentDeltaTime;

                    // Optional: Clamp scroll offsets if needed
                    // layer.scrollOffsetX = Math.max(-maxScrollX, Math.min(maxScrollX, layer.scrollOffsetX));
                    // layer.scrollOffsetY = Math.max(-maxScrollY, Math.min(maxScrollY, layer.scrollOffsetY));
                });
            }
        }
        // --- End Custom Logic ---

        // Request the next frame (already done in originalLoop)
    };

    // Add missing lastDeltaTime property access to GameLoop (for the override)
    (GameLoop.prototype as any).lastDeltaTime = 1/60;
    const originalLoopProto = (GameLoop.prototype as any).loop;
    (GameLoop.prototype as any).loop = function(currentTime: number) {
        // ... calculate deltaTime ...
        let deltaTime = (currentTime - this.lastTime) / 1000;
        // ... clamp deltaTime ...
        this.lastDeltaTime = deltaTime; // Store deltaTime on the instance
        // ... rest of original loop logic ...
        originalLoopProto.call(this, currentTime); // Call original logic if needed (careful with double RAF)
        // NOTE: This prototype modification is a bit hacky. A better approach
        // would be to have a dedicated update hook/callback in the GameLoop.
        // For this demo, we override the instance's loop method instead.
    };

    gameLoop.start();
    updateStatus('Layer Demo running. Use Arrow Keys to scroll layers with parallax.');

    // Optional: Cleanup
    window.addEventListener('beforeunload', () => { gameLoop.stop(); inputManager.destroy(); });
}

main().catch(err => { updateStatus(`Unhandled error: ${err.message}`); console.error(err); });
