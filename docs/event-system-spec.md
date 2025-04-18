# Event System - Technical Specifications

## 1. Define Event Types

- **File:** `src/core/events/EventTypes.ts`
  - **Interface `BaseEvent`**: Defines the basic structure for all events.
    - Properties: `type: string` (A unique identifier for the event type), `timestamp: number` (When the event occurred, using `performance.now()`).
  - **Interface `CollisionEvent` extends `BaseEvent`**: For collision occurrences.
    - Properties: `type: 'collisionDetected'`, `objectA: IGameObject`, `objectB: IGameObject`.
  - **Interface `InputEvent` extends `BaseEvent`**: For input actions.
    - Properties: `type: 'keyDown' | 'keyUp' | 'mouseMove' | 'mouseDown' | 'mouseUp'`, `payload: any` (e.g., `{ key: string }` for key events, `{ x: number, y: number, button?: number }` for mouse events).
  - **Interface `GameObjectEvent` extends `BaseEvent`**: For object lifecycle events.
    - Properties: `type: 'gameObjectCreated' | 'gameObjectDestroyed'`, `gameObject: IGameObject`.
  - **Interface `SettingsChangeEvent` extends `BaseEvent`**: For settings updates.
    - Properties: `type: 'settingsChanged'`, `changedSetting: string` (e.g., 'volume.master'), `newValue: any`.
  - **Interface `UIEvent` extends `BaseEvent`**: For UI interactions.
    - Properties: `type: 'buttonClicked' | 'sliderChanged'`, `elementId: string`, `value?: any`.
  - **Type `AppEvent`**: Union of all specific event interfaces (`CollisionEvent | InputEvent | GameObjectEvent | SettingsChangeEvent | UIEvent | ...`).
  - **Type `EventListenerCallback`**: `(event: AppEvent) => void`.

## 2. Event Bus Implementation

- **File:** `src/core/events/EventBus.ts`
- **Class `EventBus`**:
  - **Properties**: `listeners: Map<string, Set<EventListenerCallback>> = new Map()`.
  - **Method**: `subscribe(eventType: string, callback: EventListenerCallback): () => void`.
    - Get or create the `Set` for `eventType`.
    - Add `callback` to the `Set`.
    - Return an `unsubscribe` function that calls `this.unsubscribe(eventType, callback)`.
  - **Method**: `unsubscribe(eventType: string, callback: EventListenerCallback): void`.
    - Get the `Set` for `eventType`.
    - If the `Set` exists, remove `callback` from it.
    - Optionally, remove the `eventType` key from the map if the `Set` becomes empty.
  - **Method**: `publish(event: AppEvent): void`.
    - Get the `Set` of listeners for `event.type`.
    - If the `Set` exists, iterate through the callbacks and execute each one, passing the `event` object.
    - Consider adding error handling (try/catch) around callback execution.

## 3. Integration Strategy

- **Instantiation**: Create a single instance of `EventBus` in the main entry point of each demo application (e.g., `collision-demo.ts`, `music-demo.ts`, `main-menu-demo.ts`).
- **Dependency Injection**: Pass the `EventBus` instance to core systems and components that need to publish or subscribe.
  - Modify constructors or add dedicated setter methods (e.g., `setEventBus(bus: EventBus)`).
  - Systems needing injection: `InputManager`, `CollisionSystem`, `ObjectManager`, `SettingsManager`, `SoundManager`, potentially UI interaction handlers.
  - Components needing injection (if they publish/subscribe directly): `PlayerShootingComponent`.

## 4. Refactoring Existing Logic

- **`InputManager`**:
  - Modify `handleKeyDown`, `handleKeyUp`, `handleMouseMove`, `handleMouseDown`, `handleMouseUp`.
  - Instead of just updating internal state, `publish` corresponding `InputEvent`s with relevant payloads.
  - Keep internal state (`keysDown`, etc.) for synchronous checks (`isKeyDown`) but also provide event-driven notifications.
- **`CollisionSystem`**:
  - Remove the `onCollision` property from `CollisionComponent`.
  - In `CollisionSystem.update`, when `checkAABB` (and potentially `checkPixelCollision`) returns `true`, `publish` a `CollisionEvent` containing the two colliding objects (`objectA`, `objectB`).
- **`ObjectManager`**:
  - Modify `createObjectsForScene` (after object creation and component addition) to `publish` a `GameObjectEvent` of type `'gameObjectCreated'`.
  - Modify `destroyObject` (before actual removal) to `publish` a `GameObjectEvent` of type `'gameObjectDestroyed'`.
- **`SettingsManager`**:
  - Remove the internal `listeners` map and `add/remove/notifyVolumeListener` methods.
  - In `setMasterVolume`, `setMusicVolumeMultiplier`, `setSfxVolumeMultiplier`, after updating the internal `settings` object, `publish` a `SettingsChangeEvent` with the setting key (e.g., 'volume.master') and the new value.
- **`SoundManager`**:
  - Remove the direct calls to `settingsManager.addVolumeListener`.
  - Add a method to subscribe to `SettingsChangeEvent` from the injected `EventBus`.
  - In the event handler, check `event.changedSetting` and update the corresponding gain node (`masterGainNode`, `musicGainNode`, `sfxGainNode`).
- **`PlayerShootingComponent`**:
  - Remove direct dependency on `InputManager` for checking the fire key.
  - Subscribe to `InputEvent` of type `'keyDown'`. In the handler, check if `event.payload.key` is the fire key ('Space').
- **UI Demos (`main-menu-demo.ts`, `music-demo.ts`)**:
  - Refactor button click handlers: Instead of directly calling functions, `publish` a `UIEvent` of type `'buttonClicked'` with the `elementId`.
  - Refactor slider/toggle change handlers: `publish` a `UIEvent` of type `'sliderChanged'` or similar, with `elementId` and `value`.
  - Subscribe to `SettingsChangeEvent` to update UI elements (like sliders/toggles) if the setting was changed elsewhere.

## 5. Demo Updates

- **All Demos**: Instantiate `EventBus`. Inject it into relevant systems.
- **`collision-demo.ts`**:
  - Remove the setup loop for `collisionComp.onCollision`.
  - Add a subscription to `'collisionDetected'` events. The callback function will contain the logic previously in `onCollision` (checking groups, destroying objects, playing sounds).
- **`music-demo.ts` / `main-menu-demo.ts`**:
  - Refactor `attachEventListeners` to use `eventBus.publish` for UI interactions.
  - Add subscriptions to handle events (e.g., a central handler subscribing to `'buttonClicked'` and routing based on `elementId`, or UI components subscribing to `'settingsChanged'`).
