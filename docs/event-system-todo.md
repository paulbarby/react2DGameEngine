# Event System - Implementation Checklist

1.  [ ] **Create File:** `src/core/events/EventTypes.ts`. Define `BaseEvent`, `CollisionEvent`, `InputEvent`, `GameObjectEvent`, `SettingsChangeEvent`, `UIEvent`, `AppEvent`, `EventListenerCallback`.
2.  [ ] **Create File:** `src/core/events/EventBus.ts`. Implement the `EventBus` class with `listeners` map, `subscribe`, `unsubscribe`, and `publish` methods.
3.  [ ] **Modify Demos:** In `collision-demo.ts`, `music-demo.ts`, `main-menu-demo.ts`, `sprite-demo.ts`, `advanced-sprite-demo.ts`, `scene-manager-demo.ts`, `layer-demo.ts`:
    - Import `EventBus`.
    - Instantiate `const eventBus = new EventBus();` early in the `main` function.
4.  [ ] **Inject EventBus**: Modify constructors or add setters in the following classes to accept and store the `EventBus` instance:
    - `InputManager`
    - `CollisionSystem`
    - `ObjectManager`
    - `SettingsManager`
    - `SoundManager`
    - `PlayerShootingComponent`
5.  [ ] **Update Demo Instantiations**: Pass the `eventBus` instance when creating instances of the systems listed in step 4 within each demo's `main` function.
6.  [ ] **Refactor `InputManager`**: Modify input handlers (`handleKeyDown`, etc.) to `publish` corresponding `InputEvent`s using the injected `eventBus`.
7.  [ ] **Refactor `CollisionComponent`**: Remove the `onCollision` property definition.
8.  [ ] **Refactor `CollisionSystem`**: Remove checks/calls related to `compA.onCollision`/`compB.onCollision`. In the `update` method, after a collision is confirmed (`checkAABB`/`checkPixelCollision` returns true), `publish` a `CollisionEvent` using the injected `eventBus`.
9.  [ ] **Refactor `ObjectManager`**: In `createObjectsForScene`, after `gameObject.addComponent`, `publish` a `'gameObjectCreated'` event. In `destroyObject`, before removing the object, `publish` a `'gameObjectDestroyed'` event.
10. [ ] **Refactor `SettingsManager`**: Remove `listeners` map and `add/remove/notifyVolumeListener` methods. In volume setter methods (`setMasterVolume`, etc.), after updating `this.settings`, `publish` a `SettingsChangeEvent` using the injected `eventBus`.
11. [ ] **Refactor `SoundManager`**: Remove `settingsManager.addVolumeListener` calls in the constructor. Add a method (e.g., `registerEventHandlers`) called after instantiation to `subscribe` to `'settingsChanged'` events via the `eventBus`. The callback should update the appropriate gain node based on `event.changedSetting`.
12. [ ] **Refactor `PlayerShootingComponent`**: Remove `inputManager` property/dependency for checking fire key. In `init` or a dedicated handler registration method, `subscribe` to `'keyDown'` events via the `eventBus`. The callback checks `event.payload.key` and handles firing logic.
13. [ ] **Update `collision-demo.ts`**: Remove the loop that sets `collisionComp.onCollision`. Add `eventBus.subscribe('collisionDetected', (event) => { ... });` where the callback contains the collision handling logic (checking groups, destroying objects, playing sound).
14. [ ] **Update `music-demo.ts` / `main-menu-demo.ts`**: In `attachEventListeners` (or similar setup function), replace direct function calls in listeners with `eventBus.publish(new UIEvent(...))`. Add necessary `eventBus.subscribe` calls to handle UI updates based on events (like `'settingsChanged'`).
