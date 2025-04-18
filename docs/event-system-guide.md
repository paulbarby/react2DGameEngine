# Event System Guide

## Introduction

The event system provides a decoupled way for different parts of the game engine and application to communicate without having direct references to each other. Instead of System A calling a method directly on System B, System A can _publish_ an event, and System B (along with any other interested systems) can _subscribe_ to that event type and react accordingly.

This promotes modularity, reduces dependencies, and makes it easier to add or modify features without breaking existing code.

## Core Components

The event system consists of two main parts: the event definitions (`EventTypes.ts`) and the central dispatcher (`EventBus.ts`).

### 1. Event Definitions (`src/core/events/EventTypes.ts`)

This file defines the structure and types of all possible events within the application.

- **`BaseEvent` Interface:**

  - All specific event interfaces must extend `BaseEvent`.
  - It ensures every event has a unique `type` (string literal) and a high-resolution `timestamp`.

  ```typescript
  export interface BaseEvent {
    readonly type: string;
    readonly timestamp: number;
  }
  ```

- **Specific Event Interfaces:**

  - Define the structure for each distinct event type.
  - The `type` property uses a specific string literal (e.g., `'collisionDetected'`) for type safety.
  - Include relevant data payload properties (e.g., `objectA`, `objectB` for `CollisionEvent`).

  ```typescript
  // Example: CollisionEvent
  export interface CollisionEvent extends BaseEvent {
    readonly type: "collisionDetected"; // Specific literal type
    readonly objectA: IGameObject;
    readonly objectB: IGameObject;
  }

  // Example: InputEvent
  export interface InputEvent extends BaseEvent {
    readonly type: "keyDown" | "keyUp" | "mouseMove" | "mouseDown" | "mouseUp"; // Union of literals
    readonly payload: any; // Specific data for the input type
  }
  ```

- **`AppEvent` Union Type:**

  - A union of all specific event interfaces.
  - Used by the `EventBus` and listener callbacks to ensure type safety across all possible events.
  - **Crucially, add any new event interface to this union.**

  ```typescript
  export type AppEvent =
    | CollisionEvent
    | InputEvent
    | GameObjectEvent
    | SettingsChangeEvent
    | UIEvent;
  // | YourNewEventInterface; // Add new events here
  ```

- **`EventListenerCallback` Type:**

  - Defines the signature for functions that will handle events.
  - Takes a single argument of type `AppEvent`.

  ```typescript
  export type EventListenerCallback = (event: AppEvent) => void;
  ```

- **Event Creator Functions:**

  - Helper functions (e.g., `createCollisionEvent`, `createInputEvent`) provide a convenient and type-safe way to construct event objects.
  - They ensure the `type` and `timestamp` are correctly set.

  ```typescript
  export function createCollisionEvent(
    objectA: IGameObject,
    objectB: IGameObject
  ): CollisionEvent {
    return {
      type: "collisionDetected",
      timestamp: performance.now(),
      objectA,
      objectB,
    };
  }
  ```

### 2. Event Bus (`src/core/events/EventBus.ts`)

This class acts as the central hub for event publishing and subscription.

- **`EventBus` Class:**

  - Manages a map where keys are event type strings and values are sets of callback functions (`EventListenerCallback`).
  - Typically instantiated once and injected into systems that need to publish or subscribe.

- **`subscribe(eventType: string, callback: EventListenerCallback): () => void`:**

  - Registers a `callback` function to be executed when an event of the specified `eventType` is published.
  - Returns an `unsubscribe` function, which should be stored and called later to clean up the listener.

- **`unsubscribe(eventType: string, callback: EventListenerCallback): void`:**

  - Removes a specific `callback` from the listeners for the given `eventType`.

- **`publish(event: AppEvent): void`:**

  - Takes an event object (conforming to `AppEvent`).
  - Finds all registered listeners for the `event.type`.
  - Executes each listener callback, passing the `event` object.
  - Iterates over a copy of the listener set to handle cases where a listener might unsubscribe itself during execution.

- **`clearListeners(eventType?: string): void`:**
  - Removes all listeners for a specific event type, or all listeners for all types if no `eventType` is provided. Useful during cleanup (e.g., scene changes, application shutdown).

## How to Use

### 1. Publishing Events

Systems that generate events need an instance of the `EventBus`. This is usually injected via the constructor or a setter method.

```typescript
// Example: InputManager publishing a 'keyDown' event
import { EventBus } from "../events/EventBus.js";
import { createInputEvent } from "../events/EventTypes.js";

export class InputManager {
  private eventBus: EventBus;

  constructor(targetElement: HTMLElement | Window, eventBus: EventBus) {
    this.targetElement = targetElement;
    this.eventBus = eventBus;
    // ... add event listeners ...
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // ... logic ...
    if (!this.keysDown.has(event.code)) {
      // Use the creator function
      const inputEvent = createInputEvent("keyDown", {
        code: event.code,
        key: event.key,
        // ... other payload data ...
      });
      // Publish the event
      this.eventBus.publish(inputEvent);
    }
    this.keysDown.add(event.code);
  }
  // ... other methods ...
}
```

```typescript
// Example: CollisionSystem publishing a 'collisionDetected' event
import { EventBus } from '../events/EventBus.js';
import { createCollisionEvent } from '../events/EventTypes.js';

export class CollisionSystem {
    private eventBus: EventBus;
    // ... other properties ...

    constructor(objectManager: ObjectManager, assetLoader: AssetLoader, eventBus: EventBus) {
        this.objectManager = objectManager;
        this.assetLoader = assetLoader;
        this.eventBus = eventBus;
    }

    update(): void {
        // ... collision detection logic ...
        if (/* AABB/Pixel collision detected between objA and objB */) {
            // Ensure objects still exist before publishing
            if (this.objectManager.getObjectById(objA.id) && this.objectManager.getObjectById(objB.id)) {
                // Use the creator function
                const collisionEvent = createCollisionEvent(objA, objB);
                // Publish the event
                this.eventBus.publish(collisionEvent);
            }
        }
        // ... rest of loop ...
    }
    // ... other methods ...
}
```

### 2. Subscribing to Events

Systems or parts of the application that need to react to events also need access to the `EventBus` instance.

```typescript
// Example: Main game setup subscribing to collisions and object destruction
import { EventBus } from "./core/events/EventBus.js";
import {
  AppEvent,
  CollisionEvent,
  GameObjectEvent,
} from "./core/events/EventTypes.js";
import { CollisionComponent } from "./core/components/CollisionComponent.js";

// Assuming eventBus, objectManager, soundManager are initialized

// Store the unsubscribe function for later cleanup
const unsubscribeCollision = eventBus.subscribe(
  "collisionDetected",
  (event) => {
    // Type assertion or type guard is needed to access specific properties
    const collisionEvent = event as CollisionEvent;
    const objA = collisionEvent.objectA;
    const objB = collisionEvent.objectB;

    // Check objects still exist
    if (
      !objectManager.getObjectById(objA.id) ||
      !objectManager.getObjectById(objB.id)
    )
      return;

    const compA = objA.getComponent(CollisionComponent);
    const compB = objB.getComponent(CollisionComponent);
    if (!compA || !compB) return;

    console.log(`Collision Handler: ${objA.name} vs ${objB.name}`);

    // Handle specific collision types
    if (
      (compA.group === "enemy" && compB.group === "bullet") ||
      (compA.group === "bullet" && compB.group === "enemy")
    ) {
      if (objectManager.getObjectById(objA.id))
        objectManager.destroyObject(objA.id);
      if (objectManager.getObjectById(objB.id))
        objectManager.destroyObject(objB.id);
      // Sound is handled by the destruction listener
    }
    // ... other collision cases ...
  }
);

// Store the unsubscribe function
const unsubscribeDestroy = eventBus.subscribe(
  "gameObjectDestroyed",
  (event) => {
    const destroyedEvent = event as GameObjectEvent;
    const obj = destroyedEvent.gameObject;
    const collisionComp = obj.getComponent(CollisionComponent);

    // Play explosion if an enemy or bullet was destroyed
    if (
      collisionComp &&
      (collisionComp.group === "enemy" || collisionComp.group === "bullet")
    ) {
      soundManager.playSound("explosion");
    }
  }
);

// --- Using Type Guards (Alternative to Assertion) ---
function handleAppEvent(event: AppEvent): void {
  switch (event.type) {
    case "collisionDetected":
      // 'event' is now known to be CollisionEvent
      console.log(
        `Collision between ${event.objectA.name} and ${event.objectB.name}`
      );
      // ... handle collision ...
      break;
    case "keyDown":
      // 'event' is now known to be InputEvent with type 'keyDown'
      console.log(`Key pressed: ${event.payload.code}`);
      break;
    case "gameObjectDestroyed":
      // 'event' is now known to be GameObjectEvent with type 'gameObjectDestroyed'
      console.log(`Object destroyed: ${event.gameObject.name}`);
      // ... handle destruction ...
      break;
    // ... handle other event types ...
    default:
      // Optional: Handle unexpected event types
      // const _exhaustiveCheck: never = event; // Ensures all types are handled
      console.log(`Unhandled event type: ${(event as BaseEvent).type}`);
  }
}
const unsubscribeAll = eventBus.subscribe("collisionDetected", handleAppEvent); // Example subscription
// eventBus.subscribe('keyDown', handleAppEvent);
// eventBus.subscribe('gameObjectDestroyed', handleAppEvent);
```

### 3. Unsubscribing

It's crucial to unsubscribe listeners when they are no longer needed (e.g., when a component is destroyed, a scene is unloaded, or the application closes) to prevent memory leaks and unwanted behavior.

```typescript
// Store the returned function when subscribing
const unsubscribeCollision = eventBus.subscribe(
  "collisionDetected",
  handleCollision
);
const unsubscribeDestroy = eventBus.subscribe(
  "gameObjectDestroyed",
  handleDestruction
);

// --- Later, during cleanup ---

// Call the stored functions to unsubscribe
unsubscribeCollision();
unsubscribeDestroy();

// Or, clear all listeners of specific types or all listeners entirely
// eventBus.clearListeners('collisionDetected');
// eventBus.clearListeners(); // Clears ALL listeners
```

## Adding New Events

1.  **Define Interface:** In `src/core/events/EventTypes.ts`, create a new interface extending `BaseEvent`. Use a specific string literal for the `type` property. Add any necessary payload properties.

    ```typescript
    export interface ScoreChangedEvent extends BaseEvent {
      readonly type: "scoreChanged";
      readonly newScore: number;
      readonly delta: number;
    }
    ```

2.  **Update Union Type:** Add your new interface to the `AppEvent` union type in `EventTypes.ts`.

    ```typescript
    export type AppEvent =
      | CollisionEvent
      | InputEvent
      // ... other events ...
      | ScoreChangedEvent; // Add the new event here
    ```

3.  **Create Creator Function:** Add a corresponding creator function in `EventTypes.ts.

    ```typescript
    export function createScoreChangedEvent(
      newScore: number,
      delta: number
    ): ScoreChangedEvent {
      return {
        type: "scoreChanged",
        timestamp: performance.now(),
        newScore,
        delta,
      };
    }
    ```

4.  **Publish Event:** Identify the system responsible for triggering this event (e.g., a `GameManager` or `ScoreSystem`). Inject the `EventBus` and call `eventBus.publish(createScoreChangedEvent(...))` at the appropriate time.

    ```typescript
    // In GameManager.ts (example)
    addScore(points: number) {
        const oldScore = this.currentScore;
        this.currentScore += points;
        this.eventBus.publish(createScoreChangedEvent(this.currentScore, points));
    }
    ```

5.  **Subscribe to Event:** In any system that needs to react to the score change (e.g., a `UIManager`), inject the `EventBus`, subscribe to `'scoreChanged'`, and implement the callback logic. Remember to handle unsubscribing.

    ```typescript
    // In UIManager.ts (example)
    constructor(eventBus: EventBus) {
        this.scoreDisplayElement = document.getElementById('score');
        this.unsubscribeScore = eventBus.subscribe('scoreChanged', (event) => {
            const scoreEvent = event as ScoreChangedEvent; // Or use type guard
            if (this.scoreDisplayElement) {
                this.scoreDisplayElement.textContent = `Score: ${scoreEvent.newScore}`;
            }
        });
    }

    destroy() {
        this.unsubscribeScore(); // Unsubscribe on cleanup
    }
    ```

## Best Practices

- **Keep Listeners Simple:** Avoid putting complex or long-running logic directly inside event listeners. If significant processing is needed, the listener could trigger an action in its own system.
- **Unsubscribe:** Always unsubscribe listeners when they are no longer needed to prevent memory leaks and potential errors caused by listeners referencing destroyed objects. Store the function returned by `subscribe`.
- **Use Specific Event Types:** Prefer specific event types (e.g., `'enemyDestroyed'`) over generic ones (e.g., `'gameObjectDestroyed'`) when possible, if the handling logic is significantly different. This can simplify listener logic.
- **Payload Design:** Keep event payloads focused on the necessary information for listeners to react. Avoid including large objects or unnecessary data.
- **Error Handling:** Wrap listener callback execution in `try...catch` blocks within the `EventBus.publish` method (as implemented) to prevent one faulty listener from crashing the entire event dispatch.
