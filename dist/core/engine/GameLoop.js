const MAX_DELTA_TIME = 1 / 15; // Cap delta time to avoid large jumps (e.g., if tabbed away)
export class GameLoop {
    constructor(objectManager, renderer, sceneManager, inputManager, assetLoader) {
        this.isRunning = false;
        this.lastTime = 0;
        this.rafId = null;
        this.objectManager = objectManager;
        this.renderer = renderer;
        this.sceneManager = sceneManager;
        this.inputManager = inputManager;
        this.assetLoader = assetLoader;
        // Bind the loop method to ensure 'this' context is correct
        this.loop = this.loop.bind(this);
    }
    start() {
        if (this.isRunning) {
            console.warn('GameLoop is already running.');
            return;
        }
        this.isRunning = true;
        this.lastTime = performance.now();
        console.log('GameLoop started.');
        // Start the loop
        this.rafId = requestAnimationFrame(this.loop);
    }
    stop() {
        if (!this.isRunning) {
            console.warn('GameLoop is not running.');
            return;
        }
        this.isRunning = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        console.log('GameLoop stopped.');
    }
    loop(currentTime) {
        // If stop() was called, isRunning will be false
        if (!this.isRunning) {
            return;
        }
        // Calculate delta time in seconds
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        // Clamp delta time to prevent large jumps
        if (deltaTime > MAX_DELTA_TIME) {
            console.warn(`Delta time capped from ${deltaTime.toFixed(4)}s to ${MAX_DELTA_TIME.toFixed(4)}s`);
            deltaTime = MAX_DELTA_TIME;
        }
        // --- Update Phase ---
        // 1. Update Input Manager (process buffered events, update state)
        this.inputManager.update();
        // 2. Update Game Objects (and their components)
        this.objectManager.update(deltaTime);
        // 3. Update other systems if needed (e.g., physics, animations)
        // --- Render Phase ---
        // Get the current scene
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene) {
            // Pass deltaTime to renderScene for starfield calculation
            this.renderer.renderScene(currentScene, this.objectManager, this.assetLoader, deltaTime);
        }
        else {
            this.renderer.resize(this.renderer.viewportWidth, this.renderer.viewportHeight); // Effectively clears
            // console.log("No scene loaded, skipping render.");
        }
        // Request the next frame
        this.rafId = requestAnimationFrame(this.loop);
    }
}
