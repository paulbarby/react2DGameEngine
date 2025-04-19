import { IGameObject } from '../../types/core.js';

/**
 * Interface for defining distinct update behaviors (strategies) for GameObjects.
 * Each strategy encapsulates a specific algorithm for how a GameObject should
 * behave during its update cycle (e.g., wander, chase, attack, idle).
 */
export interface IUpdateStrategy {
    /**
     * Called once per frame when this strategy is the active strategy for the GameObject.
     * Implement the core behavior logic within this method.
     *
     * @param gameObject The GameObject this strategy is currently operating on.
     * @param deltaTime The time elapsed since the last frame, in seconds. Use this for time-based calculations (movement, timers).
     */
    update(gameObject: IGameObject, deltaTime: number): void;

    /**
     * Optional: Called immediately after this strategy becomes the active strategy
     * for the GameObject (i.e., when set via BehaviorStrategyComponent.setStrategy).
     * Use this for initialization tasks specific to this behavior, such as:
     * - Setting initial state variables within the strategy.
     * - Starting specific animations (e.g., playing a 'walk' animation when entering a 'wander' state).
     * - Acquiring initial targets or references.
     * - Resetting timers.
     *
     * @param gameObject The GameObject this strategy is being activated on.
     */
    onEnter?(gameObject: IGameObject): void;

    /**
     * Optional: Called immediately before this strategy is replaced by another strategy
     * (i.e., just before a different strategy's onEnter is called via BehaviorStrategyComponent.setStrategy),
     * or when the owning BehaviorStrategyComponent is destroyed.
     * Use this for cleanup tasks specific to this behavior, such as:
     * - Stopping animations started in onEnter.
     * - Releasing references or targets.
     * - Resetting the GameObject's state if necessary (e.g., stopping movement).
     *
     * @param gameObject The GameObject this strategy is being deactivated on.
     */
    onExit?(gameObject: IGameObject): void;
}
