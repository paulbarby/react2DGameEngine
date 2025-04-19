import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Dependency
import { StrategyDependencies } from './StrategyFactory.js'; // Import dependency type

interface ChaseStrategyConfig {
    targetId: string; // ID of the GameObject to chase
    speed?: number;
    stoppingDistance?: number; // Distance at which to stop chasing
    animationName?: string;
    loseTargetDistance?: number; // Optional: Distance at which to consider the target lost
}

/**
 * A strategy causing the GameObject to move towards a specified target GameObject.
 */
export class ChaseStrategy implements IUpdateStrategy {
    private readonly targetId: string;
    private target: IGameObject | undefined = undefined; // Changed type to undefined
    private readonly speed: number;
    private readonly stoppingDistanceSq: number; // Use squared distance
    private readonly animationName: string;
    private readonly loseTargetDistanceSq: number; // Use squared distance

    // Dependencies injected by the factory
    private objectManager: ObjectManager;

    /**
     * @param dependencies Dependencies injected by the factory (e.g., { objectManager: ObjectManager }).
     * @param config Configuration for the chase behavior.
     * @param config.targetId The ID of the GameObject to chase.
     * @param config.speed Movement speed (pixels per second). Defaults to 100.
     * @param config.stoppingDistance Distance from target to stop moving. Defaults to 50.
     * @param config.animationName Animation to play while chasing (e.g., 'run'). Defaults to 'run'.
     * @param config.loseTargetDistance Optional distance beyond which the target is considered lost. Defaults to Infinity.
     */
    constructor(dependencies: StrategyDependencies, config: ChaseStrategyConfig) { // Accept StrategyDependencies
        if (!dependencies?.objectManager) {
            throw new Error("ChaseStrategy requires 'objectManager' in dependencies.");
        }
        if (!config?.targetId) {
            throw new Error("ChaseStrategy requires 'targetId' in config.");
        }

        this.objectManager = dependencies.objectManager;
        this.targetId = config.targetId;
        this.speed = config.speed ?? 100;
        const stoppingDist = config.stoppingDistance ?? 50;
        this.stoppingDistanceSq = stoppingDist * stoppingDist;
        this.animationName = config.animationName ?? 'run';
        const loseDist = config.loseTargetDistance ?? Infinity;
        this.loseTargetDistanceSq = loseDist * loseDist;
    }

    onEnter(gameObject: IGameObject): void {
        console.log(`ChaseStrategy (${gameObject.name}): Entering, target='${this.targetId}'.`);
        this.target = this.objectManager.getObjectById(this.targetId);
        if (!this.target) {
            console.warn(`ChaseStrategy (${gameObject.name}): Initial target '${this.targetId}' not found.`);
            // NOTE: The controller component should ideally handle switching away if the target is invalid.
        }
        gameObject.getComponent(AnimationComponent)?.play(this.animationName);
    }

    update(gameObject: IGameObject, deltaTime: number): void {
        // Attempt to re-acquire target if lost (e.g., destroyed and recreated, or initially not found)
        if (!this.target) {
            this.target = this.objectManager.getObjectById(this.targetId);
            if (!this.target) {
                // console.warn(`ChaseStrategy (${gameObject.name}): Target '${this.targetId}' still not found. Doing nothing.`);
                // TODO: Signal to controller that target is lost?
                return; // No target, cannot chase
            }
        }

        const dx = this.target.x - gameObject.x;
        const dy = this.target.y - gameObject.y;
        const distSq = dx * dx + dy * dy;

        // Check if target is lost (too far away)
        if (distSq > this.loseTargetDistanceSq) {
            console.log(`ChaseStrategy (${gameObject.name}): Target lost (distance ${Math.sqrt(distSq).toFixed(1)} > ${Math.sqrt(this.loseTargetDistanceSq).toFixed(1)}).`);
            this.target = undefined; // Lose the target
            // TODO: Signal to controller that target is lost?
            // Example: gameObject.getComponent(AIControllerComponent)?.handleTargetLost();
            return;
        }

        // Move only if further than stopping distance
        if (distSq > this.stoppingDistanceSq) {
            const dist = Math.sqrt(distSq);
            const moveX = (dx / dist) * this.speed * deltaTime;
            const moveY = (dy / dist) * this.speed * deltaTime;

            gameObject.x += moveX;
            gameObject.y += moveY;

            // Optional: Face the target
            // gameObject.rotation = Math.atan2(dy, dx);
        } else {
            // Within stopping distance
            // Optional: Stop animation or switch to an 'attack ready' animation?
            // gameObject.getComponent(AnimationComponent)?.play('attack_ready');
        }
    }

    onExit(gameObject: IGameObject): void {
        console.log(`ChaseStrategy (${gameObject.name}): Exiting.`);
        this.target = undefined; // Clear target reference
        // Optional: Stop the chase animation.
        // gameObject.getComponent(AnimationComponent)?.stop();
    }
}
