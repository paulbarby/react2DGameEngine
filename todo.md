To-Do List:

Phase 1: Core Engine Foundation
Define core types in src/types/core.ts and src/types/project.ts.
Implement AssetLoader in src/core/assets/AssetLoader.ts.
Create GameObject class in src/core/objects/GameObject.ts.
Develop the component system in src/core/components/.
Implement Renderer in src/core/rendering/Renderer.ts.
Create SceneManager in src/core/scene/SceneManager.ts.
Develop ObjectManager in src/core/objects/ObjectManager.ts.
Implement GameLoop in src/core/engine/GameLoop.ts.
Create basic InputManager and SoundManager.

Phase 2: Editor UI Shell & State
Set up the project using Vite and install dependencies.
Create state stores (projectStore and editorStore) in src/store/.
Develop the main layout in src/App.tsx.
Create basic panel components in src/components/panels/.

Phase 3: Engine Integration & Preview
Implement the Viewport component in src/components/panels/Viewport.tsx.
Integrate the engine with the editor using React hooks.
Modify the Renderer and GameLoop for real-time scene rendering.

Phase 4: Editing Functionality
Develop the PropertiesInspector component in src/components/panels/PropertiesInspector.tsx.
Add functionality for adding/removing items in panels.
Implement sprite and animation components.
Create tools like SpriteSheetUtility and AnimationEditor.

Phase 5: Saving, Loading, Exporting
Implement project saving in src/utils/fileSaver.ts.
Add project loading functionality.
Develop game export functionality in src/utils/exportGame.ts.

Phase 6: Refinement & Polish
Apply consistent styling.
Add error handling and user feedback.
Improve usability with drag-and-drop, shortcuts, and tooltips.
Optimize performance and add tests.
