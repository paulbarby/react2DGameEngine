# Behavior Strategy Pattern Guide

This document explains the implementation of the Strategy pattern for defining and managing AI behaviors in the game engine.

## Purpose

The Strategy pattern allows defining a family of algorithms (behaviors), encapsulating each one, and making them interchangeable. This pattern lets the algorithm vary independently from the clients that use it. In our engine, it's used to dynamically change the behavior of AI-controlled GameObjects (e.g., enemies) without altering the core `AIControllerComponent` or the `GameObject` itself.

## Core Components

1.  **`IUpdateStrategy` Interface (`src/core/behaviors/IUpdateStrategy.ts`)**:

    - Defines the common interface for all behavior strategies.
    - Requires an `update(gameObject: IGameObject, deltaTime: number, context: StrategyContext): void` method.
    - `StrategyContext` provides access to necessary game state (like the player's position, other objects, etc.) required for decision-making within the strategy.

2.  **Concrete Strategy Classes (`src/core/behaviors/*.ts`)**:

    - **`IdleStrategy`**: Makes the GameObject do nothing or perform a simple idle animation/action.
    - **`WanderStrategy`**: Makes the GameObject move randomly within certain bounds or follow a simple path.
    - **`ChaseStrategy`**: Makes the GameObject move towards a target (e.g., the player).
    - **`FleeStrategy`**: Makes the GameObject move away from a target.
    - **`AttackStrategy`**: Makes the GameObject perform an attack action (e.g., firing a projectile).
    - Each class implements the `IUpdateStrategy` interface, providing specific logic for its behavior.

3.  **`StrategyFactory` (`src/core/behaviors/StrategyFactory.ts`)**:

    - A simple factory responsible for creating instances of concrete strategy classes based on a string key (e.g., "idle", "wander").
    - Allows decoupling the `AIControllerComponent` from the specific strategy constructors.

4.  **`BehaviorStrategyComponent` (`src/core/components/BehaviorStrategyComponent.ts`)**:

    - A component attached to an AI-controlled GameObject.
    - Holds a reference to the _current_ `IUpdateStrategy` instance.
    - Provides a method `setStrategy(strategyName: string)` which uses the `StrategyFactory` to switch the current behavior strategy.
    - Its `update` method simply delegates the call to the `update` method of the _current_ strategy instance, passing the necessary `gameObject`, `deltaTime`, and `context`.

5.  **`AIControllerComponent` (`src/core/components/AIControllerComponent.ts`)**:
    - The "brain" of the AI GameObject.
    - Holds references to required components, including `BehaviorStrategyComponent`.
    - In its `update` method, it assesses the game state (e.g., player proximity, AI health).
    - Based on the assessment, it decides which behavior is appropriate and calls `behaviorStrategyComponent.setStrategy()` to switch behaviors if necessary.
    - It does _not_ contain the actual behavior logic itself; that resides within the strategies.

## Interaction Flow

1.  An AI GameObject is created with an `AIControllerComponent` and a `BehaviorStrategyComponent`.
2.  The `AIControllerComponent` might set an initial strategy (e.g., "wander") via the `BehaviorStrategyComponent`.
3.  In the game loop, the `GameObject`'s `update` method is called.
4.  This calls the `update` method of the `AIControllerComponent`.
5.  The `AIControllerComponent` evaluates the situation (e.g., "Is the player close?").
6.  If a behavior change is needed (e.g., player is close -> switch to "chase"), it calls `behaviorStrategyComponent.setStrategy("chase")`.
7.  The `GameObject`'s `update` also calls the `update` method of the `BehaviorStrategyComponent`.
8.  The `BehaviorStrategyComponent` calls the `update` method of its _currently active strategy_ (e.g., the `ChaseStrategy` instance).
9.  The active strategy (e.g., `ChaseStrategy`) executes its specific logic, potentially moving the `GameObject`, changing animations, or triggering actions like firing.

## Usage Example (Conceptual)

```typescript
// In AIControllerComponent.update(deltaTime)

const behaviorComp = this.gameObject.getComponent(BehaviorStrategyComponent);
const player = findTarget(); // Function to find the player object
const distance = calculateDistance(this.gameObject, player);

if (distance < CHASE_RADIUS && distance > ATTACK_RADIUS) {
  // If player is close but not too close, chase
  behaviorComp.setStrategy("chase");
} else if (distance <= ATTACK_RADIUS) {
  // If player is very close, attack
  behaviorComp.setStrategy("attack");
} else {
  // Otherwise, wander
  behaviorComp.setStrategy("wander");
}

// The actual movement/attack logic happens when BehaviorStrategyComponent.update()
// calls the update method of the currently set strategy.
```

This pattern makes it easy to add new behaviors (just create a new class implementing `IUpdateStrategy` and register it with the `StrategyFactory`) or modify existing ones without touching the `AIControllerComponent`.
