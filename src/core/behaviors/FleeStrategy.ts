import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Dependency
import { SpriteComponent } from '../components/SpriteComponent.js'; // Import SpriteComponent
import { StrategyDependencies } from './StrategyFactory.js'; // Import dependency type

interface FleeStrategyConfig {
    fleeFromId: string; // ID of the GameObject to flee from
    speed?: number;
    fleeDistance?: number; // Distance at which to stop fleeing
    animationName?: string;
    bounds?: { width: number, height: number }; // Optional world bounds
}

/**
 * A strategy causing the GameObject to move away from a specified target GameObject.
 */
export class FleeStrategy implements IUpdateStrategy {
    private readonly fleeFromId: string;
    private target: IGameObject | undefined = undefined; // Changed type to undefined
    private readonly speed: number;
    private readonly fleeDistanceSq: number; // Use squared distance
    private readonly animationName: string;
    private readonly bounds?: { width: number, height: number };

    // Dependencies injected by the factory
    private objectManager: ObjectManager;

    /**
     * @param dependencies Dependencies injected by the factory (e.g., { objectManager: ObjectManager }).
     * @param config Configuration for the flee behavior.
     * @param config.fleeFromId The ID of the GameObject to flee from.
     * @param config.speed Movement speed (pixels per second). Defaults to 80.
     * @param config.fleeDistance Distance from target at which to stop fleeing. Defaults to 300.
     * @param config.animationName Animation to play while fleeing (e.g., 'run' or 'flee'). Defaults to 'run'.
     * @param config.bounds Optional world boundaries to stay within.
     */
    constructor(dependencies: StrategyDependencies, config: FleeStrategyConfig) { // Accept StrategyDependencies
        // Runtime check for required dependency
        if (!dependencies?.objectManager) {
            throw new Error("FleeStrategy requires 'objectManager' in dependencies.");
        }
        if (!config?.fleeFromId) {
            throw new Error("FleeStrategy requires 'fleeFromId' in config.");
        }

        this.objectManager = dependencies.objectManager; // Assign checked dependency
        this.fleeFromId = config.fleeFromId;
        this.speed = config.speed ?? 80;
        const fleeDist = config.fleeDistance ?? 300;
        this.fleeDistanceSq = fleeDist * fleeDist;
        this.animationName = config.animationName ?? 'run';
        this.bounds = config.bounds;
    }

    onEnter(gameObject: IGameObject): void {
        console.log(`FleeStrategy (${gameObject.name}): Entering, fleeing from='${this.fleeFromId}'.`);
        this.target = this.objectManager.getObjectById(this.fleeFromId); // Assignment is fine
        if (!this.target) {
            console.warn(`FleeStrategy (${gameObject.name}): Initial target '${this.fleeFromId}' not found.`);
            // NOTE: Controller should handle switching away if target is invalid.
        }
        gameObject.getComponent(AnimationComponent)?.play(this.animationName);
    }

    update(gameObject: IGameObject, deltaTime: number): void {
        // Attempt to re-acquire target if lost
        if (!this.target) {
            this.target = this.objectManager.getObjectById(this.fleeFromId); // Assignment is fine
            if (!this.target) {
                // Target doesn't exist, maybe stop fleeing? Signal controller?
                // For now, do nothing.
                // gameObject.getComponent(AIControllerComponent)?.handleFleeTargetLost();
                return;
            }
        }

        const dx = gameObject.x - this.target.x; // Reverse direction for fleeing
        const dy = gameObject.y - this.target.y;
        const distSq = dx * dx + dy * dy;

        // Stop fleeing if far enough away
        if (distSq >= this.fleeDistanceSq) {
            console.log(`FleeStrategy (${gameObject.name}): Reached safe distance (${Math.sqrt(distSq).toFixed(1)} >= ${Math.sqrt(this.fleeDistanceSq).toFixed(1)}).`);
            // TODO: Signal to controller that fleeing is complete?
            // gameObject.getComponent(AIControllerComponent)?.handleFleeComplete();
            // Optional: Stop animation or switch to idle? Depends on controller logic.
            // gameObject.getComponent(AnimationComponent)?.play('idle');
            return; // Stop moving
        }

        // Normalize direction vector
        const dist = Math.sqrt(distSq);
        let moveX = 0;
        let moveY = 0;
        if (dist > 0.001) { // Avoid division by zero if already on top of target
             moveX = (dx / dist) * this.speed * deltaTime;
             moveY = (dy / dist) * this.speed * deltaTime;
        } else {
            // If directly on top, flee in a random direction (or default like upwards)
            moveX = 0;
            moveY = -this.speed * deltaTime; // Flee upwards example
        }


        gameObject.x += moveX;
        gameObject.y += moveY;

        // Optional: Face away from the target
        // gameObject.rotation = Math.atan2(dy, dx);

        // Optional: Clamp position to bounds if provided
        if (this.bounds) {
            // Use SpriteComponent for dimensions
            const spriteComp = gameObject.getComponent(SpriteComponent);
            const halfWidth = (spriteComp?.width ?? 0) / 2;
            const halfHeight = (spriteComp?.height ?? 0) / 2;
            gameObject.x = Math.max(halfWidth, Math.min(this.bounds.width - halfWidth, gameObject.x));
            gameObject.y = Math.max(halfHeight, Math.min(this.bounds.height - halfHeight, gameObject.y));
        }
    }

    onExit(gameObject: IGameObject): void {
        console.log(`FleeStrategy (${gameObject.name}): Exiting.`);
        this.target = undefined; // Clear target reference
        // Optional: Stop the flee animation.
        // gameObject.getComponent(AnimationComponent)?.stop();
    }
}
