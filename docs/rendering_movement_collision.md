# Engine Flow: Rendering, Movement, and Collision

This document explains how sprite rendering, object movement, and collision detection interact within the game engine's main loop. Understanding this flow is crucial for debugging and adding new features.

## Game Loop Order

The core `GameLoop` executes the following steps in order on each frame:

1.  **Calculate Delta Time:** Determines the time elapsed since the last frame.
2.  **Input Update (`InputManager.update()`):** Processes any buffered input events (though currently, state is updated directly in event handlers).
3.  **Object Update (`ObjectManager.update(deltaTime)`):**
    - Iterates through all active `GameObject` instances.
    - Calls the `update(deltaTime)` method on each `GameObject`.
    - The `GameObject.update()` method then iterates through all its attached `Component` instances and calls their respective `update(deltaTime)` methods.
    - **Movement happens here:** Components like `PlayerControllerComponent`, `EnemyMovementComponent`, and `BulletMovementComponent` modify their parent `GameObject`'s `x` and `y` properties within their `update` methods based on input, logic, and `deltaTime`.
4.  **Collision Detection (`CollisionSystem.update()`):**
    - This system runs _after_ all objects have potentially moved in the current frame.
    - It collects all `CollisionComponent` instances from active game objects.
    - It iterates through pairs of components, checking if their `group` and `collidesWith` properties indicate they should interact.
    - If they should interact, it performs an **AABB (Axis-Aligned Bounding Box)** check using the _current_ `x` and `y` positions of the involved `GameObject`s and their dimensions (usually derived from their `SpriteComponent`).
    - If the AABB check detects an overlap, it triggers the `onCollision` callback functions defined on the `CollisionComponent`s involved.
    - **State Changes/Destruction:** Callbacks often destroy objects (`objectManager.destroyObject()`) or modify game state (e.g., update score, player health).
5.  **Rendering (`Renderer.renderScene(...)`):**
    - This happens _last_ in the main update sequence for the frame.
    - It clears the canvas and draws background elements (like the starfield).
    - It iterates through scene layers and then through the `GameObject` instances provided by the `ObjectManager` for each layer.
    - For each object, it gets the `SpriteComponent`.
    - It uses the `GameObject`'s **final `x` and `y` position for this frame** (after movement and potential collision effects) and the `SpriteComponent`'s properties (anchor point, source rectangle, image) to draw the sprite onto the canvas at the correct screen location.

## Key Relationships

- **Movement Affects Collision:** Object positions are updated _before_ collision detection runs. The `CollisionSystem` uses these updated positions to determine if overlaps occur.
- **Movement Affects Rendering:** Object positions are updated _before_ rendering. The `Renderer` uses these updated positions to draw objects in their final location for the frame.
- **Collision Affects State (and potentially Rendering):** Collision callbacks can destroy objects. If an object is destroyed _before_ the `Renderer` gets to it in the same frame, it won't be drawn (as `ObjectManager` will no longer return it). If the callback modifies an object's state (e.g., changing a sprite via `AnimationComponent`), the `Renderer` will draw that new state.
- **Rendering Reads State:** The `Renderer` is primarily a "reader" of the current game state (object positions, sprite details) as determined by the update and collision phases. It doesn't typically modify game logic state itself.
- **Components Drive Behavior:** Movement logic resides in specific components. Collision properties (`group`, `collidesWith`, `onCollision`) are defined in the `CollisionComponent`. Visual representation details are in the `SpriteComponent` and potentially modified by `AnimationComponent`. The `GameObject` acts as a container, and the `ObjectManager` orchestrates their updates.
