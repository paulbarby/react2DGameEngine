import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { StrategyDependencies } from './StrategyFactory.js'; // Import dependency type
import { SpriteComponent } from '../components/SpriteComponent.js'; // Import SpriteComponent

interface WanderStrategyConfig {
    speed?: number;
    wanderRadius?: number;
    changeTargetInterval?: number;
    animationName?: string;
    bounds?: { width: number, height: number }; // Optional world bounds
}

/**
 * A strategy causing the GameObject to move randomly within a specified radius
 * around its starting point.
 */
export class WanderStrategy implements IUpdateStrategy {
    private targetX: number = 0;
    private targetY: number = 0;
    private changeTargetTimer: number = 0;
    private readonly speed: number;
    private readonly wanderRadius: number;
    private readonly changeTargetInterval: number;
    private readonly animationName: string;
    private readonly bounds?: { width: number, height: number };
    private startX: number = 0;
    private startY: number = 0;

    /**
     * @param dependencies Dependencies injected by the factory (currently unused by WanderStrategy).
     * @param config Configuration for the wander behavior.
     * @param config.speed Movement speed (pixels per second). Defaults to 50.
     * @param config.wanderRadius Max distance from start point to wander. Defaults to 150.
     * @param config.changeTargetInterval Base time in seconds between picking new targets. Defaults to 3.0.
     * @param config.animationName Animation to play while wandering (e.g., 'walk'). Defaults to 'walk'.
     * @param config.bounds Optional world boundaries to stay within.
     */
    constructor(dependencies: StrategyDependencies, config?: WanderStrategyConfig) {
        // dependencies are ignored for now, but the parameter is required by the factory
        this.speed = config?.speed ?? 50;
        this.wanderRadius = config?.wanderRadius ?? 150;
        this.changeTargetInterval = config?.changeTargetInterval ?? 3.0;
        this.animationName = config?.animationName ?? 'walk'; // Default animation name
        this.bounds = config?.bounds;
    }

    onEnter(gameObject: IGameObject): void {
        console.log(`WanderStrategy (${gameObject.name}): Entering.`);
        this.startX = gameObject.x;
        this.startY = gameObject.y;
        this.pickNewTarget(gameObject); // Pick initial target
        gameObject.getComponent(AnimationComponent)?.play(this.animationName);
    }

    update(gameObject: IGameObject, deltaTime: number): void {
        this.changeTargetTimer -= deltaTime;
        if (this.changeTargetTimer <= 0) {
            this.pickNewTarget(gameObject);
        }

        const dx = this.targetX - gameObject.x;
        const dy = this.targetY - gameObject.y;
        const distSq = dx * dx + dy * dy; // Use squared distance for comparison

        // Move if further than a small threshold (e.g., 5 pixels squared)
        if (distSq > 25) {
            const dist = Math.sqrt(distSq);
            const moveX = (dx / dist) * this.speed * deltaTime;
            const moveY = (dy / dist) * this.speed * deltaTime;

            gameObject.x += moveX;
            gameObject.y += moveY;

            // Optional: Face direction of movement (adjust rotation)
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

        } else {
            // Close enough to target, pick a new one immediately
            this.pickNewTarget(gameObject);
        }
    }

    private pickNewTarget(gameObject: IGameObject): void {
        // Pick target relative to the starting position to prevent drifting too far
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.wanderRadius; // Random distance within radius

        this.targetX = this.startX + Math.cos(angle) * radius;
        this.targetY = this.startY + Math.sin(angle) * radius;

        // Clamp target to bounds if necessary
        if (this.bounds) {
             this.targetX = Math.max(0, Math.min(this.bounds.width, this.targetX));
             this.targetY = Math.max(0, Math.min(this.bounds.height, this.targetY));
        }

        // Reset timer with slight randomization
        this.changeTargetTimer = this.changeTargetInterval * (0.75 + Math.random() * 0.5);
        // console.log(`WanderStrategy (${gameObject.name}): New target (${this.targetX.toFixed(1)}, ${this.targetY.toFixed(1)})`);
    }

    onExit(gameObject: IGameObject): void {
        console.log(`WanderStrategy (${gameObject.name}): Exiting.`);
        // Optional: Stop the wander animation if needed.
        // gameObject.getComponent(AnimationComponent)?.stop();
    }
}
