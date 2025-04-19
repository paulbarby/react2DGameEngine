# TODO List: Strategy Pattern Component Implementation

This list outlines the steps required to implement the Strategy Pattern for extensible GameObject behavior.

## Core Pattern Implementation

1.  **Define Interface:**

    - [x] Create `src/core/behaviors/IUpdateStrategy.ts`.
    - [x] Define the `IUpdateStrategy` interface with `update(gameObject, deltaTime)`, optional `onEnter(gameObject)`, and optional `onExit(gameObject)` methods.

2.  **Implement Concrete Strategies:**

    - [x] Create `src/core/behaviors/IdleStrategy.ts` implementing `IUpdateStrategy` (e.g., play idle animation, do nothing else).
    - [x] Create `src/core/behaviors/WanderStrategy.ts` implementing `IUpdateStrategy` (e.g., pick random points, move towards them, play walk/move animation).
    - [x] Create `src/core/behaviors/ChaseStrategy.ts` implementing `IUpdateStrategy` (e.g., requires target, move towards target, play run/chase animation, needs `ObjectManager` dependency).
    - [x] Create `src/core/behaviors/FleeStrategy.ts` (Optional) implementing `IUpdateStrategy`.
    - [x] Create `src/core/behaviors/AttackStrategy.ts` (Optional) implementing `IUpdateStrategy`.

3.  **Implement Strategy Component:**

    - [x] Create `src/core/components/BehaviorStrategyComponent.ts` extending `BaseComponent`.
    - [x] Add `currentStrategy: IUpdateStrategy | null` property.
    - [x] Implement `constructor` to potentially take initial strategy config.
    - [x] Implement `init()` to call `onEnter` on the initial strategy (via `setStrategy`).
    - [x] Implement `update(deltaTime)` to delegate to `currentStrategy.update()`.
    - [x] Implement `setStrategy(newStrategy)` method, handling `onExit` for the old strategy and `onEnter` for the new one.
    - [x] Implement `destroy()` to call `onExit` on the final strategy.

4.  **Implement Strategy Factory/Registry:**
    - [x] Create `src/core/behaviors/StrategyFactory.ts` (or `StrategyRegistry.ts`).
    - [x] Implement `register(key: string, constructor: new (...args: any[]) => IUpdateStrategy)` method.
    - [x] Implement `create(key: string, dependencies: any, config: any): IUpdateStrategy | null` method to instantiate strategies, inject dependencies (`ObjectManager`, `SoundManager`, etc.), and pass specific config.
    - [x] Register the concrete strategy classes (`IdleStrategy`, `WanderStrategy`, `ChaseStrategy`, etc.) in the factory.

## Integration

5.  **Update ObjectManager:**

    - [x] Inject `StrategyFactory` into `ObjectManager` (or make factory accessible). (Factory is static, accessed directly)
    - [x] Modify `ObjectManager.createObjectsForScene` (or component creation logic) to:
      - [x] Recognize `BehaviorStrategyComponent` config.
      - [x] Use the `StrategyFactory` to create the initial strategy instance based on configuration (`initialStrategyKey`, `initialStrategyConfig`). (Done within `BehaviorStrategyComponent.init`)
      - [x] Pass necessary dependencies (`objectManager`, `soundManager`, etc.) from `ObjectManager` to the factory's `create` method (via component props).
      - [x] Inject the factory into the `BehaviorStrategyComponent` instance (e.g., via `setStrategyFactory`).
    - [x] Register `BehaviorStrategyComponent` using `objectManager.registerComponent`.

6.  **Implement Strategy Switching Logic:**
    - **Option A: AI Controller Component:**
      - [x] Create `src/core/components/AIControllerComponent.ts` extending `BaseComponent`.
      - [x] Inject dependencies like `ObjectManager` (to find player/targets).
      - [x] In `init()`, get reference to `BehaviorStrategyComponent` on the same `GameObject`.
      - [x] In `update()`, implement logic to check conditions (e.g., player distance, health).
      - [x] Based on conditions, call `behaviorStrategyComponent.setStrategy(StrategyFactory.create(...))` to switch behaviors.
      - [x] Register `AIControllerComponent` in `ObjectManager`.
    - **Option B: Integrate with State Machine (If implemented later):**
      - [ ] Modify `StateMachineComponent`'s `onEnter` logic for relevant states to call `behaviorStrategyComponent.setStrategy()`.

## Demonstration & Testing

7.  **Create New Demo:**

    - [x] Create `web/behavior-strategy-demo.html`.
    - [x] Create `src/behavior-strategy-demo.ts`.
    - [x] Define a scene with GameObjects using `BehaviorStrategyComponent` and `AIControllerComponent` (or other switching logic).
      - [x] Example: An enemy that wanders (`WanderStrategy`) until the player gets close, then switches to chasing (`ChaseStrategy`).
    - [x] Configure the initial strategies and controller logic in the scene definition.
    - [x] Add route in `index.js`.
    - [x] Add link in `web/index.html`.

8.  **Testing:**
    - [ ] Verify strategies are instantiated correctly with dependencies.
    - [ ] Verify `onEnter` and `onExit` are called during initialization and switching.
    - [ ] Verify `update` logic of different strategies executes correctly (movement, animation changes).
    - [ ] Verify strategy switching occurs based on the controller logic.

## Documentation & Refinement

9.  **Documentation:**

    - [x] Add comments explaining the `IUpdateStrategy` interface and its methods.
    - [x] Add comments explaining the purpose and usage of `BehaviorStrategyComponent`.
    - [x] Add comments explaining the `StrategyFactory` and how to register/create strategies.
    - [x] Add comments explaining the chosen strategy switching mechanism (`AIControllerComponent` or State Machine integration).
    - [ ] Consider a markdown guide (`docs/behavior-strategy-pattern.md`) explaining the overall pattern.

10. **Refinement:**
    - [ ] Review error handling (e.g., strategy not found in factory, missing dependencies).
    - [ ] Optimize strategy creation/switching if necessary.
    - [ ] Consider if strategies need access to the switching controller (e.g., to signal completion or failure).
