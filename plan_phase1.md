# Plan: Phase 1 - Core Engine Foundation

This document outlines the technical specifications and implementation checklist for Phase 1 of the Game Maker project.

## Technical Specifications

### 1. Define Core Types

- **File:** `src/types/project.ts`
  - **Interface `AssetManifest`**: Defines `assets.json`. Properties: `images: { [key: string]: string }`, `sounds: { [key: string]: string }`, `spriteSheets: { [key: string]: string }`.
  - **Interface `SpriteDefinition`**: Defines `_def.json`. Properties: `image: string`, `frameWidth: number`, `frameHeight: number`, `sprites: { [name: string]: { x: number, y: number } }`, `animations?: { [name: string]: AnimationDefinition }`.
  - **Interface `AnimationDefinition`**: Defines animation structure. Properties: `frames: string[]`, `duration: number`, `loop: boolean`.
  - **Interface `Project`**: Defines `project.json`. Properties: `startScene: string`, `scenes: { [name: string]: Scene }`.
  - **Interface `Scene`**: Defines scene structure. Properties: `id: string`, `name: string`, `layers: Layer[]`, `objects: GameObjectConfig[]`.
  - **Interface `Layer`**: Defines layer structure. Properties: `id: string`, `name: string`, `depth: number`, `visible: boolean`.
  - **Interface `GameObjectConfig`**: Defines object config in `project.json`. Properties: `id: string`, `name: string`, `type: string`, `x: number`, `y: number`, `layerId: string`, `components: ComponentConfig[]`.
  - **Interface `ComponentConfig`**: Defines component config. Properties: `type: string`, `properties: { [key: string]: any }`.
- **File:** `src/types/core.ts`
  - **Interface `IGameObject`**: Defines runtime GameObject. Properties: `id: string`, `name: string`, `x: number`, `y: number`, `rotation: number`, `scaleX: number`, `scaleY: number`, `components: IComponent[]`. Methods: `update(deltaTime: number): void`, `addComponent(component: IComponent): void`, `getComponent<T extends IComponent>(type: { new(...args: any[]): T }): T | undefined`, `destroy(): void`.
  - **Interface `IComponent`**: Defines base component. Properties: `gameObject: IGameObject | null`. Methods: `init(): void`, `update(deltaTime: number): void`, `destroy(): void`.
  - **Type `Asset`**: Union type `HTMLImageElement | AudioBuffer | SpriteDefinition`.
  - **Type `LoadedAssets`**: `Map<string, Asset>`.

### 2. Asset Loader

- **File:** `src/core/assets/AssetLoader.ts`
- **Class `AssetLoader`**:
  - **Properties**: `loadedAssets: LoadedAssets = new Map()`, `audioContext: AudioContext`.
  - **Constructor**: `constructor(audioContext: AudioContext)`. Store `audioContext`.
  - **Method**: `async loadManifest(url: string): Promise<AssetManifest>`. Fetch, parse JSON, return manifest. Add error handling.
  - **Method**: `async loadAllAssets(manifest: AssetManifest): Promise<void>`. Use `Promise.all` to call `loadImage`, `loadSound`, `loadJson` based on manifest entries. Store results in `loadedAssets`. Add error handling.
  - **Private Method**: `async loadImage(url: string): Promise<HTMLImageElement>`. Load image via `new Image()`. Return Promise.
  - **Private Method**: `async loadSound(url: string): Promise<AudioBuffer>`. Fetch, use `this.audioContext.decodeAudioData`. Return Promise.
  - **Private Method**: `async loadJson<T>(url: string): Promise<T>`. Fetch, parse JSON. Return Promise.
  - **Method**: `getAsset<T extends Asset>(key: string): T | undefined`. Retrieve from `loadedAssets`.
  - **Method**: `getSpriteSheetDefinition(key: string): SpriteDefinition | undefined`. Specific getter.

### 3. Basic GameObject

- **File:** `src/core/objects/GameObject.ts`
- **Class `GameObject` implements `IGameObject`**:
  - **Properties**: `id: string`, `name: string`, `x: number`, `y: number`, `rotation: number`, `scaleX: number`, `scaleY: number`, `components: IComponent[] = []`.
  - **Constructor**: `constructor(config: GameObjectConfig)`. Initialize properties from config.
  - **Method**: `update(deltaTime: number): void`. Loop through `components` and call `update`.
  - **Method**: `addComponent(component: IComponent): void`. Add to `components`, set `component.gameObject = this`, call `component.init()`.
  - **Method**: `getComponent<T extends IComponent>(typeConstructor: { new(...args: any[]): T }): T | undefined`. Find component where `component instanceof typeConstructor`.
  - **Method**: `destroy(): void`. Loop through `components` and call `destroy`. Clear `components`.

### 4. Component System

- **File:** `src/core/components/BaseComponent.ts`
  - **Abstract Class `BaseComponent` implements `IComponent`**:
    - **Property**: `gameObject: IGameObject | null = null`.
    - **Abstract Method**: `init(): void`.
    - **Abstract Method**: `update(deltaTime: number): void`.
    - **Abstract Method**: `destroy(): void`.
- **File:** `src/core/components/SpriteComponent.ts` (Example)
  - **Class `SpriteComponent` extends `BaseComponent`**:
    - **Properties**: `spriteRef: string`, `width: number`, `height: number`. (Add more as needed, e.g., `offsetX`, `offsetY`).
    - **Constructor**: Accept config properties.
    - **Method**: `init(): void`. (e.g., Get initial sprite dimensions from definition).
    - **Method**: `update(deltaTime: number): void`. (Placeholder for animation logic).
    - **Method**: `destroy(): void`. (Cleanup if needed).
- **File:** `src/core/components/index.ts`
  - Export all component classes (e.g., `export * from './BaseComponent';`, `export * from './SpriteComponent';`).
- **Requirement**: Need a mechanism (e.g., a registry map `Map<string, new (...args: any[]) => IComponent>`) in `ObjectManager` or elsewhere to create component instances from the `type` string in `ComponentConfig`.

### 5. Renderer

- **File:** `src/core/rendering/Renderer.ts`
- **Class `Renderer`**:
  - **Properties**: `ctx: CanvasRenderingContext2D`, `canvas: HTMLCanvasElement`, `viewportWidth: number`, `viewportHeight: number`.
  - **Constructor**: `constructor(canvas: HTMLCanvasElement)`. Get context, store canvas, set initial dimensions. Throw error if context is null.
  - **Method**: `resize(width: number, height: number): void`. Update canvas element `width`/`height` and internal properties.
  - **Method**: `renderScene(scene: Scene, objectManager: ObjectManager, assetLoader: AssetLoader): void`.
    - Clear canvas: `this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight)`.
    - Sort layers by `depth`.
    - Loop `scene.layers`:
      - Skip if `!layer.visible`.
      - Apply layer transforms (placeholder).
      - Get objects: `const objects = objectManager.getObjectsByLayer(layer.id)`.
      - Loop `objects`:
        - Perform basic viewport culling (check if object AABB intersects viewport).
        - If visible, call `this.drawObject(object, assetLoader)`.
      - Restore layer transforms.
  - **Private Method**: `drawObject(object: IGameObject, assetLoader: AssetLoader): void`.
    - Apply object transforms: `this.ctx.save()`, `translate(object.x, object.y)`, `rotate(object.rotation)`, `scale(object.scaleX, object.scaleY)`.
    - Get `SpriteComponent`: `const spriteComp = object.getComponent(SpriteComponent)`.
    - If `spriteComp`:
      - Use `assetLoader` to get `SpriteDefinition` and `HTMLImageElement` based on `spriteComp.spriteRef` (needs parsing logic for sheet vs. frame).
      - Calculate source `sx, sy, sw, sh` and destination `dx, dy, dw, dh` based on sprite definition and component properties.
      - Draw: `this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`.
    - Handle other renderable components.
    - Restore object transforms: `this.ctx.restore()`.

### 6. Scene Manager

- **File:** `src/core/scene/SceneManager.ts`
- **Class `SceneManager`**:
  - **Properties**: `currentScene: Scene | null = null`, `projectData: Project | null = null`.
  - **Method**: `loadProject(project: Project): void`. Store `project`.
  - **Method**: `loadScene(sceneName: string): boolean`. Find scene in `this.projectData.scenes`. Set `this.currentScene`. Return success/failure. Check if `projectData` exists.
  - **Method**: `getCurrentScene(): Scene | null`. Return `this.currentScene`.

### 7. Object Manager

- **File:** `src/core/objects/ObjectManager.ts`
- **Class `ObjectManager`**:
  - **Properties**: `gameObjects: Map<string, IGameObject> = new Map()`, `objectsByLayer: Map<string, IGameObject[]> = new Map()`, `componentRegistry: Map<string, new (config: any) => IComponent> = new Map()`.
  - **Constructor**: (Optionally accept component registry).
  - **Method**: `registerComponent(type: string, constructor: new (config: any) => IComponent): void`. Add to `componentRegistry`.
  - **Method**: `createObjectsForScene(scene: Scene): void`.
    - Call `clearAllObjects()`.
    - Loop `scene.objects` (config):
      - Create `GameObject` instance.
      - Store in `gameObjects`.
      - Add to `objectsByLayer` array (create array if needed).
      - Loop `config.components`:
        - Find constructor in `componentRegistry` using `componentConfig.type`.
        - If found, create component: `new ComponentConstructor(componentConfig.properties)`.
        - Add to GameObject: `gameObject.addComponent(componentInstance)`.
        - Log error if component type not registered.
  - **Method**: `update(deltaTime: number): void`. Loop `gameObjects.values()` and call `update`.
  - **Method**: `getObjectById(id: string): IGameObject | undefined`. Get from `gameObjects`.
  - **Method**: `getObjectsByLayer(layerId: string): IGameObject[]`. Get array from `objectsByLayer` (return `[]` if not found).
  - **Method**: `destroyObject(id: string): void`. Find object, call `destroy()`, remove from `gameObjects` and `objectsByLayer`.
  - **Method**: `clearAllObjects(): void`. Loop `gameObjects`, call `destroy()`, clear both maps.

### 8. Game Loop

- **File:** `src/core/engine/GameLoop.ts`
- **Class `GameLoop`**:
  - **Properties**: `isRunning: boolean = false`, `lastTime: number = 0`, `rafId: number | null = null`, `objectManager: ObjectManager`, `renderer: Renderer`, `sceneManager: SceneManager`, `inputManager: InputManager`, `assetLoader: AssetLoader`.
  - **Constructor**: `constructor(objectManager: ObjectManager, renderer: Renderer, sceneManager: SceneManager, inputManager: InputManager, assetLoader: AssetLoader)`. Store references. Bind `this.loop`.
  - **Method**: `start(): void`. Set `isRunning = true`, `this.lastTime = performance.now()`, `this.rafId = requestAnimationFrame(this.loop)`.
  - **Method**: `stop(): void`. Set `isRunning = false`, `cancelAnimationFrame(this.rafId!)`.
  - **Private Method**: `loop(currentTime: number): void`. Bound method.
    - If `!this.isRunning`, return.
    - Calculate `deltaTime = (currentTime - this.lastTime) / 1000`. Clamp `deltaTime` if necessary.
    - `this.lastTime = currentTime`.
    - `this.inputManager.update()`.
    - `this.objectManager.update(deltaTime)`.
    - `const scene = this.sceneManager.getCurrentScene()`.
    - If `scene`, `this.renderer.renderScene(scene, this.objectManager, this.assetLoader)`.
    - `this.rafId = requestAnimationFrame(this.loop)`.

### 9. Input & Sound Managers

- **File:** `src/core/input/InputManager.ts`
  - **Class `InputManager`**:
    - **Properties**: `keysDown: Set<string> = new Set()`, `mousePosition: { x: number, y: number } = { x: 0, y: 0 }`, `mouseButtonsDown: Set<number> = new Set()`. (Add more state as needed, e.g., keys pressed/released this frame).
    - **Constructor**: Add event listeners (`keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`) to `window` or a target element. Update state in handlers.
    - **Method**: `update(): void`. (Process buffered events if using that pattern, or clear "pressed/released this frame" state).
    - **Method**: `isKeyDown(key: string): boolean`. Check `keysDown`.
    - **Method**: `getMousePosition(): { x: number, y: number }`. Return `mousePosition`.
    - **Method**: `isMouseButtonDown(button: number): boolean`. Check `mouseButtonsDown`.
    - **Method**: `destroy(): void`. Remove event listeners.
- **File:** `src/core/sound/SoundManager.ts`
  - **Class `SoundManager`**:
    - **Properties**: `audioContext: AudioContext`, `assetLoader: AssetLoader`.
    - **Constructor**: `constructor(audioContext: AudioContext, assetLoader: AssetLoader)`. Store references.
    - **Method**: `playSound(key: string, loop: boolean = false): AudioBufferSourceNode | null`.
      - Get `AudioBuffer` asset using `this.assetLoader.getAsset(key)`. Check type.
      - If buffer exists: Create `AudioBufferSourceNode`, connect to `this.audioContext.destination`, set `buffer` and `loop`, call `start(0)`. Return source.
      - Return `null` if asset not found or not an AudioBuffer.
    - **Method**: `stopSound(source: AudioBufferSourceNode): void`. Call `source.stop()`. Handle potential errors.

---

## IMPLEMENTATION CHECKLIST:

1.  **Create File:** `src/types/project.ts`. Define interfaces: `AssetManifest`, `SpriteDefinition`, `AnimationDefinition`, `Project`, `Scene`, `Layer`, `GameObjectConfig`, `ComponentConfig`.
2.  **Create File:** `src/types/core.ts`. Define interfaces: `IGameObject`, `IComponent`. Define types: `Asset`, `LoadedAssets`.
3.  **Create File:** `src/core/assets/AssetLoader.ts`. Implement `AssetLoader` class with constructor, `loadManifest`, `loadAllAssets`, `loadImage`, `loadSound`, `loadJson`, `getAsset`, `getSpriteSheetDefinition`. Ensure `AudioContext` is provided or created.
4.  **Create File:** `src/core/objects/GameObject.ts`. Implement `GameObject` class implementing `IGameObject`, including constructor, `update`, `addComponent`, `getComponent`, `destroy`.
5.  **Create File:** `src/core/components/BaseComponent.ts`. Implement abstract `BaseComponent` class implementing `IComponent`.
6.  **Create File:** `src/core/components/SpriteComponent.ts`. Implement example `SpriteComponent` extending `BaseComponent`.
7.  **Create File:** `src/core/components/index.ts`. Export component classes.
8.  **Create File:** `src/core/rendering/Renderer.ts`. Implement `Renderer` class with constructor, `resize`, `renderScene`, `drawObject`. Include basic transform logic and sprite drawing using `drawImage`. Add viewport culling logic.
9.  **Create File:** `src/core/scene/SceneManager.ts`. Implement `SceneManager` class with `loadProject`, `loadScene`, `getCurrentScene`.
10. **Create File:** `src/core/objects/ObjectManager.ts`. Implement `ObjectManager` class with `gameObjects`, `objectsByLayer`, `componentRegistry`, constructor, `registerComponent`, `createObjectsForScene`, `update`, `getObjectById`, `getObjectsByLayer`, `destroyObject`, `clearAllObjects`.
11. **Create File:** `src/core/engine/GameLoop.ts`. Implement `GameLoop` class with constructor, `start`, `stop`, and the main `loop` method using `requestAnimationFrame`. Ensure managers are correctly called in order. Bind `loop`.
12. **Create File:** `src/core/input/InputManager.ts`. Implement `InputManager` class with basic keyboard and mouse state tracking via event listeners. Include `update`, `isKeyDown`, `getMousePosition`, `isMouseButtonDown`, `destroy`.
13. **Create File:** `src/core/sound/SoundManager.ts`. Implement `SoundManager` class with constructor, `playSound`, `stopSound`. Ensure `AudioContext` and `AssetLoader` are linked.
