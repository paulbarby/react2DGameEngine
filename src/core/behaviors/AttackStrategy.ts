import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Dependency for target check
import { EventBus } from '../events/EventBus.js'; // Dependency for firing events
import { createGameplayEvent } from '../events/EventTypes.js'; // Event type
import { StrategyDependencies } from './StrategyFactory.js'; // Import dependency type

interface AttackStrategyConfig {
    targetId: string; // ID of the GameObject to attack
    attackInterval?: number; // Time between attacks in seconds
    attackRange?: number; // Maximum distance to initiate/continue attack
    animationName?: string; // Animation to play during attack wind-up/action
    attackEventName?: string; // Custom event name to fire on attack action
}

/**
 * A strategy causing the GameObject to perform periodic attacks towards a target,
 * potentially playing an animation and firing an event.
 */
export class AttackStrategy implements IUpdateStrategy {
    private readonly targetId: string;
    private target: IGameObject | undefined = undefined;
    private readonly attackInterval: number;
    private readonly attackRangeSq: number;
    private readonly animationName: string;
    private readonly attackEventName: string;
    private attackTimer: number = 0;

    // Dependencies injected by the factory
    private objectManager: ObjectManager;
    private eventBus: EventBus;

    /**
     * @param dependencies Dependencies injected by the factory (e.g., { objectManager, eventBus }).
     * @param config Configuration for the attack behavior.
     * @param config.targetId The ID of the GameObject to target.
     * @param config.attackInterval Time between attacks. Defaults to 1.5 seconds.
     * @param config.attackRange Max distance to attack. Defaults to 100 pixels.
     * @param config.animationName Animation to play. Defaults to 'attack'.
     * @param config.attackEventName Event to fire on attack. Defaults to 'attackAction'.
     */
    constructor(dependencies: StrategyDependencies, config: AttackStrategyConfig) { // Accept StrategyDependencies
        // Runtime check for required dependencies
        if (!dependencies?.objectManager || !dependencies?.eventBus) {
            throw new Error("AttackStrategy requires 'objectManager' and 'eventBus' in dependencies.");
        }
        if (!config?.targetId) {
            throw new Error("AttackStrategy requires 'targetId' in config.");
        }

        this.objectManager = dependencies.objectManager; // Assign checked dependency
        this.eventBus = dependencies.eventBus; // Assign checked dependency
        this.targetId = config.targetId;
        this.attackInterval = config.attackInterval ?? 1.5;
        const range = config.attackRange ?? 100;
        this.attackRangeSq = range * range;
        this.animationName = config.animationName ?? 'attack';
        this.attackEventName = config.attackEventName ?? 'attackAction';
        this.attackTimer = this.attackInterval * Math.random(); // Start with random delay
    }

    onEnter(gameObject: IGameObject): void {
        console.log(`AttackStrategy (${gameObject.name}): Entering, target='${this.targetId}'.`);
        this.target = this.objectManager.getObjectById(this.targetId);
        if (!this.target) {
            console.warn(`AttackStrategy (${gameObject.name}): Initial target '${this.targetId}' not found.`);
            // Controller should switch away.
        }
        // Optional: Play an 'attack_ready' or initial attack animation frame?
        // gameObject.getComponent(AnimationComponent)?.play('attack_ready');
    }

    update(gameObject: IGameObject, deltaTime: number): void {
        // Re-acquire target if lost
        if (!this.target) {
            this.target = this.objectManager.getObjectById(this.targetId);
            if (!this.target) {
                // Target gone, signal controller to switch strategy
                // gameObject.getComponent(AIControllerComponent)?.handleAttackTargetLost();
                return;
            }
        }

        const dx = this.target.x - gameObject.x;
        const dy = this.target.y - gameObject.y;
        const distSq = dx * dx + dy * dy;

        // Check if target is out of range
        if (distSq > this.attackRangeSq) {
            console.log(`AttackStrategy (${gameObject.name}): Target out of range (${Math.sqrt(distSq).toFixed(1)} > ${Math.sqrt(this.attackRangeSq).toFixed(1)}).`);
            // Signal controller to switch (e.g., back to Chase)
            // gameObject.getComponent(AIControllerComponent)?.handleTargetOutOfAttackRange();
            return;
        }

        // Optional: Face the target
        // gameObject.rotation = Math.atan2(dy, dx);

        // Update attack timer
        this.attackTimer -= deltaTime;
        if (this.attackTimer <= 0) {
            this.performAttack(gameObject);
            this.attackTimer = this.attackInterval; // Reset timer
        }
    }

    private performAttack(gameObject: IGameObject): void {
        console.log(`AttackStrategy (${gameObject.name}): Performing attack on ${this.target?.name}!`);

        // 1. Play attack animation
        gameObject.getComponent(AnimationComponent)?.play(this.animationName); // Assumes animation exists

        // 2. Fire attack event (other systems can listen for this)
        // The event payload could include the attacker and target IDs/objects
        this.eventBus.publish(createGameplayEvent(this.attackEventName, {
            attackerId: gameObject.id,
            targetId: this.target?.id,
            // attacker: gameObject, // Could pass full objects if needed
            // target: this.target
        }));

        // Note: Actual damage/projectile creation would likely happen in a system
        // listening for the 'attackAction' event, not directly in the strategy.
    }

    onExit(gameObject: IGameObject): void {
        console.log(`AttackStrategy (${gameObject.name}): Exiting.`);
        this.target = undefined; // Clear target reference
        // Optional: Stop any attack-related animations
        // gameObject.getComponent(AnimationComponent)?.stop();
    }
}
