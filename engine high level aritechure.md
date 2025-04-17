Okay, let's translate this comprehensive specification into a development plan using TypeScript and React.

**Goal:** Create the Game Maker (GM) editor using React for the UI and TypeScript for both the UI components and the core game engine. The engine will be designed to run within the React app for preview and be bundled separately for export.

**Technology Stack:**

1.  **Language:** TypeScript
2.  **UI Framework:** React (using Vite for development server and bundling)
3.  **State Management (React):** Zustand (Recommended for simplicity and performance in this context) or Redux Toolkit.
4.  **Styling:** CSS Modules, Tailwind CSS, or Styled Components (Choose one based on preference). Tailwind is often efficient for utility-based styling in editors.
5.  **Canvas Rendering:** Native HTML Canvas 2D API (accessed via React Refs).
6.  **File Handling (Export):** `jszip` library for creating zip archives.
7.  **Icons:** `react-icons` or similar library.

**Project Structure (Example using Vite):**

```
egm-project/
├── public/
│   └── index.html           # Base HTML template for editor
├── src/
│   ├── App.tsx              # Main React application component (layout)
│   ├── main.tsx             # React entry point
│   ├── vite-env.d.ts        # Vite environment types
│   ├── assets/              # Static UI assets (logos, etc. - NOT game assets)
│   ├── components/          # Reusable React UI components
│   │   ├── panels/          # Components for each main panel (Toolbar, Viewport, Scene, etc.)
│   │   ├── common/          # Buttons, Inputs, Modals, etc.
│   │   ├── inspectors/      # Specific property inspector components
│   │   └── tools/           # Sprite Sheet Utility, Animation Editor components
│   ├── core/                # The Core Game Engine (TypeScript, framework-agnostic)
│   │   ├── assets/
│   │   │   └── AssetLoader.ts
│   │   ├── components/      # Engine component implementations (KeyboardMovement, SheetSprite, etc.)
│   │   │   └── BaseComponent.ts
│   │   ├── engine/
│   │   │   └── GameLoop.ts
│   │   ├── input/
│   │   │   └── InputManager.ts
│   │   ├── objects/
│   │   │   └── GameObject.ts
│   │   │   └── ObjectManager.ts
│   │   ├── rendering/
│   │   │   └── Renderer.ts
│   │   ├── scene/
│   │   │   └── SceneManager.ts
│   │   │   └── Layer.ts
│   │   ├── sound/
│   │   │   └── SoundManager.ts
│   │   └── index.ts         # Entry point for the core engine module
│   ├── hooks/               # Custom React hooks (e.g., useEngineInstance)
│   ├── store/               # Zustand state management (or Redux structure)
│   │   ├── projectStore.ts  # Store for project.json, assets.json data
│   │   ├── editorStore.ts   # Store for editor state (selected items, tool states)
│   │   └── index.ts
│   ├── types/               # Shared TypeScript interfaces and types
│   │   ├── core.ts          # Engine-specific types (GameObject, Component, etc.)
│   │   ├── project.ts       # Types for project.json, assets.json structure
│   │   └── editor.ts        # Editor-specific types
│   ├── utils/               # Utility functions (file handling, unique IDs, etc.)
│   └── styles/              # Global styles or base CSS (if not using pure utility/component styles)
├── package.json
├── tsconfig.json
├── tsconfig.node.json       # For Vite/build process
└── vite.config.ts
```

**Key Implementation Details & Steps:**

**Phase 1: Core Engine Foundation (TypeScript)**

1.  **Define Core Types (`src/types/core.ts`, `src/types/project.ts`):** Create interfaces for `AssetManifest`, `SpriteDefinition`, `AnimationDefinition`, `Project`, `Scene`, `Layer`, `GameObjectConfig`, `ComponentConfig`, `GameObject`, `Component`, etc. Use these throughout the engine and editor.
2.  **Asset Loader (`src/core/assets/AssetLoader.ts`):**
    - Implement `loadManifest(url)` to fetch and parse `assets.json`.
    - Implement `loadAllAssets(manifest)`: Iterates manifest, loads images (`new Image()`), audio (`fetch` + `AudioContext.decodeAudioData`), and parses `_def.json` files. Store loaded assets in maps keyed by the logical name. Use Promises (`Promise.all`) for concurrent loading.
    - Implement `getAsset(key)`, `getSpriteSheetDefinition(key)`, etc.
3.  **Basic GameObject (`src/core/objects/GameObject.ts`):** Implement the base class with properties defined in the spec (`id`, `name`, `x`, `y`, etc.). Include placeholder `update` and component management methods.
4.  **Component System (`src/core/components/`):**
    - Define the base `Component` interface/abstract class (`init`, `update`, `destroy`).
    - Implement `SpriteComponent` (minimal, mainly for structure).
5.  **Renderer (`src/core/rendering/Renderer.ts`):**
    - Takes a CanvasRenderingContext2D instance.
    - Implement `renderScene(sceneData, objectManager, assetLoader)`:
      - Clear canvas.
      - Iterate through `sceneData.layers`.
      - Apply layer transforms (`save`, `translate`, `restore`).
      - Iterate through GameObjects associated with the layer (retrieved from `objectManager`).
      - Implement basic `drawObject` for `sprite` type using `fillText`.
      - Implement viewport culling logic.
6.  **Scene Manager (`src/core/scene/SceneManager.ts`):**
    - Method `loadScene(sceneName, projectData)` to parse the specific scene structure from the loaded `project.json`.
    - Stores the current scene definition. (Actual GameObject _instantiation_ will likely happen via the Object Manager).
7.  **Object Manager (`src/core/objects/ObjectManager.ts`):**
    - Manages a pool of `GameObject` instances.
    - `createObjectsForScene(sceneData)`: Iterates scene objects, creates `GameObject` instances, initializes properties, creates and attaches Component instances based on config. Links GameObjects to Layers.
    - `update(deltaTime)`: Calls `update` on all active GameObjects.
    - `getObjectsByLayer(layerId)`: Method needed by the Renderer.
8.  **Game Loop (`src/core/engine/GameLoop.ts`):**
    - Basic `requestAnimationFrame` loop.
    - Calculates `deltaTime`.
    - Calls `InputManager.update()` (placeholder).
    - Calls `ObjectManager.update(deltaTime)`.
    - Calls `Renderer.renderScene(...)`.
9.  **Input & Sound Managers (`src/core/input/`, `src/core/sound/`):** Implement basic structure and methods as defined. Use browser APIs (`addEventListener`, `Web Audio API`).

**Phase 2: Editor UI Shell & State (React + Zustand)**

1.  **Project Setup:** Initialize Vite project (`npm create vite@latest egm-project -- --template react-ts`). Install dependencies (`zustand`, `jszip`, `react-icons`, chosen styling library).
2.  **State Stores (`src/store/`):**
    - `projectStore`: Holds the entire `project.json` content, `assets.json` content, and potentially the _parsed_ sprite/animation definitions. Actions for loading, saving, modifying data (e.g., `updateObjectName`, `addLayer`, `addComponentConfig`).
    - `editorStore`: Holds UI state like the selected scene ID, selected layer ID, selected object ID, active tool, etc. Actions for updating selections.
3.  **Main Layout (`src/App.tsx`):** Set up the main multi-panel structure using basic `div`s or a layout library. Use CSS Grid or Flexbox.
4.  **Panel Components (`src/components/panels/`):** Create basic functional components for each panel (Toolbar, Viewport, Scene, Object, Asset, Properties). Initially, they might just display static text.
5.  **Toolbar Component:** Add buttons for Load (triggers file input), Save (triggers download), Export (placeholder).
6.  **Connect Panels to State:** Use Zustand hooks (`useProjectStore`, `useEditorStore`) in the panel components to display data.
    - **Scene Panel:** List scenes from `projectStore.project.scenes`. Add selection logic updating `editorStore.selectedSceneId`. List layers of the selected scene, allowing selection (`editorStore.selectedLayerId`) and visibility toggling (updates `projectStore`).
    - **Object Panel:** List objects from the selected scene/layer in `projectStore`. Add selection logic (`editorStore.selectedObjectId`).
    - **Asset Panel:** List assets from `projectStore.assets`.

**Phase 3: Engine Integration & Preview**

1.  **Viewport Component (`src/components/panels/Viewport.tsx`):**
    - Use `useRef` to get a reference to an HTML `<canvas>` element.
    - Use `useEffect` to initialize the Core Engine instance when the component mounts. Pass the canvas context to the `Renderer`.
    - Create a custom hook `useEngineInstance` or similar manage the engine lifecycle (start, stop, cleanup).
    - The engine's `GameLoop` should run independently.
    - **Data Flow:** The engine needs the _current_ scene data to render. The Viewport component should subscribe to the `projectStore` and potentially the `editorStore` (for the current scene ID). When relevant data changes in the store, pass the updated scene definition/data to the engine instance (e.g., `engine.loadSceneData(newSceneData)` or have the engine itself subscribe to the store).
2.  **Render Scene in Preview:** Modify the `Renderer` and `GameLoop` to fetch the _currently selected_ scene data (via the SceneManager, which gets data passed from the UI/Store) and render it.
3.  **Basic Object Rendering:** Implement the `spriteSheet` drawing logic in the `Renderer`, using the `AssetLoader` to get images and definitions.

**Phase 4: Editing Functionality**

1.  **Properties Inspector (`src/components/panels/PropertiesInspector.tsx` & `src/components/inspectors/`):**
    - Conditionally render different inspector forms based on `editorStore.selected*` IDs (Scene, Layer, Object).
    - Use controlled components (inputs, checkboxes, dropdowns) linked to the data in `projectStore` for the selected item.
    - On change events, call Zustand actions in `projectStore` to update the data (e.g., `updateObjectPosition(objectId, newX, newY)`). The reactive nature of Zustand + React + Engine updates should refresh the preview canvas.
2.  **Adding/Removing Items:** Implement functionality in Scene, Object, and Asset panels to add/remove items by calling appropriate `projectStore` actions. Generate unique IDs (`crypto.randomUUID()` or similar).
3.  **Component Management:** In the Object Inspector, list components. Implement "Add Component" (show dropdown of available component types). Implement configuring component properties via dynamically generated forms based on `component.config`. Update `projectStore` accordingly.
4.  **Sprite/Animation Components:** Implement `SheetSpriteComponent` in the core engine, including animation playback logic (`update` method checks `elapsedTime`, updates `gameObject.spriteRef`).
5.  **Sprite Sheet Utility (`src/components/tools/SpriteSheetUtility.tsx`):**
    - Create a modal component.
    - Takes a `spriteSheetAssetKey` as a prop.
    - Loads the image using the key (perhaps via `AssetLoader` or directly).
    - Displays the image. Renders grid overlays based on user input fields (rows, cols, size, etc.).
    - Allows clicking/defining sprites.
    - On save, updates the corresponding `_def.json` data within the `projectStore`.
6.  **Animation Editor (`src/components/tools/AnimationEditor.tsx`):**
    - Similar modal structure.
    - Takes `spriteSheetAssetKey`. Loads definition from `projectStore`.
    - UI to create animation sets, drag sprites into sequences, set duration/mode.
    - On save, updates the `animations` part of the definition in `projectStore`.
7.  **Asset Panel Workflow:** Implement "Add Asset" functionality:
    - Use `<input type="file">`.
    - Read file(s) using `FileReader`.
    - Prompt user for logical key(s).
    - Update `assets.json` in `projectStore`.
    - **Important:** Decide how to handle the actual asset files. For a browser-only editor, you might store them in memory (e.g., as base64 data URLs referenced in the manifest, suitable for small projects) or require the user to manage a folder structure alongside the project JSON files if saving locally. For export, you'll need access to the original files. A simple approach is to load files, update the manifest _in the store_, and rely on these loaded files for the preview. Saving/Exporting handles persisting them.

**Phase 5: Saving, Loading, Exporting**

1.  **Saving Project (`src/utils/fileSaver.ts`):**
    - Create function `saveProject(projectData, assetsData, definitions)`.
    - Stringify `project.json` and `assets.json` from the store.
    - **Challenge:** Need to also save potentially modified `_def.json` contents. Store these alongside the asset manifest in the store or serialize them separately.
    - Create blobs for each JSON file.
    - Use `URL.createObjectURL` and hidden `<a>` tag clicks to trigger downloads for `project.json`, `assets.json`, and any modified `_def.json` files. Instruct the user to save them together. (Alternative: Zip them).
2.  **Loading Project:**
    - Use file inputs for `project.json` and `assets.json`.
    - Use `FileReader` to read text content.
    - Parse JSON and update the `projectStore`.
    - Trigger asset loading via `AssetLoader` based on the loaded manifest. Handle potential relative path issues if files aren't where the manifest expects.
3.  **Export Game (`src/utils/exportGame.ts`):**
    - Create function `exportGame(projectData, assetsData, allAssetFiles)`.
    - **Requires Access to Original Files:** This is the trickiest part for a pure browser editor. Options:
      - Require user to re-select all asset files during export.
      - Store file handles (using File System Access API - modern browsers only).
      - Store file contents (e.g., base64) in the store (memory intensive).
      - Assume files exist relative to the loaded `project.json` (only works if user maintains structure).
    - **Bundling:**
      - Use `jszip`.
      - Add `project.json` and `assets.json` (stringified) to the zip.
      - Add all necessary `_def.json` files.
      - Add **all actual asset files** (images, sounds) maintaining the relative paths defined in `assets.json`.
      - Add the Core Engine code (pre-bundled JS file - you might need a separate build step for the engine runtime, or bundle it dynamically).
      - Add a simple `index.html` loader template. This HTML will:
        - Include the bundled engine JS.
        - Instantiate the engine.
        - Tell the engine to load `assets.json` (from the zip structure).
        - Tell the engine to load all assets from the manifest.
        - Tell the engine to load `project.json`.
        - Tell the engine to start the game using `projectData.startScene`.
    - Generate the zip file blob and trigger download.

**Phase 6: Refinement & Polish**

1.  **Styling:** Apply consistent styling using the chosen method.
2.  **Error Handling:** Add checks for missing assets, invalid configurations, etc. Provide user feedback.
3.  **Usability:** Improve drag-and-drop (e.g., reordering layers/objects), keyboard shortcuts, tooltips.
4.  **Performance:** Optimize rendering (ensure culling works), state updates (avoid unnecessary re-renders). Debounce frequent updates if needed.
5.  **Testing:** Add unit tests for core engine logic and potentially integration tests for editor interactions.

**Key Considerations:**

- **State Management:** Keep the `projectStore` as the single source of truth for game data. UI components read from it, and user actions dispatch updates to it. The engine reads data _from_ the store for previews.
- **Engine Independence:** Design the `src/core` engine module to be as independent of React as possible. It should primarily work with plain JavaScript objects and the Canvas API. This facilitates easier bundling for export.
- **Asset File Handling:** This is a significant challenge in browser-based tools. Clearly define how asset files are referenced, stored (in memory? rely on user filesystem?), and accessed for export. The File System Access API is powerful but not universally supported. Storing blobs/data URLs in the store is simpler initially but has size limits.
- **Code Bundling for Export:** Decide how to provide the engine code for the exported game. A dedicated build process (e.g., using Vite library mode) to output a single `engine.js` file is cleanest.

This detailed plan provides a roadmap for building the EGM using React and TypeScript, addressing the core features outlined in the specification. Remember to break down these phases into smaller, manageable tasks.

see engine specifications.md for more details
