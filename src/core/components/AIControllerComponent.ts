import { BaseComponent } from './BaseComponent.js';
import { BehaviorStrategyComponent } from './BehaviorStrategyComponent.js';
import { StrategyFactory } from '../behaviors/StrategyFactory.js';
import { IGameObject } from '../../types/core.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Dependency
import { IdleStrategy } from '../behaviors/IdleStrategy.js'; // Strategy types for checks
import { WanderStrategy } from '../behaviors/WanderStrategy.js';
import { ChaseStrategy } from '../behaviors/ChaseStrategy.js';
import { AttackStrategy } from '../behaviors/AttackStrategy.js';
// Import other strategies if needed (e.g., FleeStrategy)

interface AIControllerComponentProps {
    targetTag?: string; // Tag to identify the target GameObject (e.g., 'player')
    detectionRadius?: number; // Distance to start chasing
    attackRange?: number; // Distance to start attacking
    loseTargetDistance?: number; // Distance to stop chasing/attacking and go back to idle/wander
    // Config for specific strategies (can be passed down)
    wanderConfig?: any;
    chaseConfig?: any;
    attackConfig?: any;
    idleConfig?: any;
}

/**
 * A component that observes game state (like target proximity) and dynamically
 * switches the behavior strategy of its GameObject using BehaviorStrategyComponent.
 */
export class AIControllerComponent extends BaseComponent {
    private config: AIControllerComponentProps;
    private behaviorStrategyComponent: BehaviorStrategyComponent | null = null;
    private target: IGameObject | null = null;
    private objectManager: ObjectManager; // Injected dependency
    private strategyFactory: typeof StrategyFactory; // Reference to the static factory class
    private coreDependencies: any; // Store dependencies for creating strategies

    // Configuration properties with defaults
    private readonly targetTag: string;
    private readonly detectionRadiusSq: number;
    private readonly attackRangeSq: number;
    private readonly loseTargetDistanceSq: number;

    /**
     * @param props Configuration for the AI controller.
     * @param props.dependencies Core dependencies like objectManager, eventBus, etc.
     * @param props.targetTag Tag of the target GameObject (e.g., 'player'). Defaults to 'player'.
     * @param props.detectionRadius Distance to start chasing. Defaults to 300.
     * @param props.attackRange Distance to start attacking. Defaults to 80.
     * @param props.loseTargetDistance Distance to lose target. Defaults to 400.
     * @param props.wanderConfig Config for WanderStrategy.
     * @param props.chaseConfig Config for ChaseStrategy.
     * @param props.attackConfig Config for AttackStrategy.
     * @param props.idleConfig Config for IdleStrategy.
     */
    constructor(props: AIControllerComponentProps & { dependencies: any }) {
        super();
        if (!props.dependencies?.objectManager) {
            throw new Error("AIControllerComponent requires 'objectManager' in dependencies.");
        }
        this.config = props;
        this.objectManager = props.dependencies.objectManager;
        this.strategyFactory = StrategyFactory; // Store reference to the static class
        this.coreDependencies = props.dependencies; // Store for strategy creation

        // Set config with defaults
        this.targetTag = props.targetTag ?? 'player';
        const detectionRadius = props.detectionRadius ?? 300;
        const attackRange = props.attackRange ?? 80;
        const loseTargetDistance = props.loseTargetDistance ?? 400;

        this.detectionRadiusSq = detectionRadius * detectionRadius;
        this.attackRangeSq = attackRange * attackRange;
        this.loseTargetDistanceSq = loseTargetDistance * loseTargetDistance;
    }

    init(): void {
        this.behaviorStrategyComponent = this.gameObject?.getComponent(BehaviorStrategyComponent) ?? null;
        if (!this.behaviorStrategyComponent) {
            console.error(`AIControllerComponent on ${this.gameObject?.name} requires a BehaviorStrategyComponent.`);
            return;
        }
        // Initial state is usually idle or wander, set by BehaviorStrategyComponent's config
        console.log(`AIControllerComponent (${this.gameObject?.name}): Initialized. Target tag: '${this.targetTag}'.`);
    }

    update(deltaTime: number): void {
        if (!this.gameObject || !this.behaviorStrategyComponent) return;

        // 1. Find Target (if not already found or if current target is invalid)
        if (!this.target || !this.objectManager.getObjectById(this.target.id)) {
            // Find first object with the target tag
            // In a real game, might need more sophisticated target selection
            this.target = null; // Reset target
            for (const obj of this.objectManager.getAllObjects()) {
                if (obj.type === this.targetTag) { // Assuming 'type' is used like a tag
                    this.target = obj;
                    console.log(`AIControllerComponent (${this.gameObject.name}): Found target '${this.target.name}'.`);
                    break;
                }
            }
        }

        // 2. Determine Desired State based on Target Proximity
        let desiredStrategyType: Function | null = null; // Use constructor type for comparison
        let strategyConfig: any = null;
        let strategyKey: string = 'idle'; // Default key

        if (this.target) {
            const dx = this.target.x - this.gameObject.x;
            const dy = this.target.y - this.gameObject.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= this.attackRangeSq) {
                // Within attack range -> Attack
                desiredStrategyType = AttackStrategy;
                strategyKey = 'attack';
                // Ensure targetId is passed in config for AttackStrategy
                strategyConfig = { ...this.config.attackConfig, targetId: this.target.id };
            } else if (distSq <= this.detectionRadiusSq) {
                // Within detection radius (but outside attack range) -> Chase
                desiredStrategyType = ChaseStrategy;
                strategyKey = 'chase';
                // Ensure targetId is passed in config for ChaseStrategy
                strategyConfig = { ...this.config.chaseConfig, targetId: this.target.id, loseTargetDistance: Math.sqrt(this.loseTargetDistanceSq) };
            } else if (distSq > this.loseTargetDistanceSq) {
                // Outside lose target distance -> Lose target and go back to default
                console.log(`AIControllerComponent (${this.gameObject.name}): Target lost (distance ${Math.sqrt(distSq).toFixed(1)} > ${Math.sqrt(this.loseTargetDistanceSq).toFixed(1)}).`);
                this.target = null; // Lose the target explicitly
                desiredStrategyType = WanderStrategy; // Or IdleStrategy
                strategyKey = 'wander'; // Or 'idle'
                strategyConfig = this.config.wanderConfig; // Or idleConfig
            } else {
                // Between detection and lose distance while chasing -> Keep Chasing
                // Check if currently chasing, if not, switch to chase
                const currentStrategy = this.behaviorStrategyComponent.getCurrentStrategy();
                if (!(currentStrategy instanceof ChaseStrategy)) {
                    desiredStrategyType = ChaseStrategy;
                    strategyKey = 'chase';
                    strategyConfig = { ...this.config.chaseConfig, targetId: this.target.id, loseTargetDistance: Math.sqrt(this.loseTargetDistanceSq) };
                } else {
                    // Already chasing, do nothing
                    desiredStrategyType = ChaseStrategy; // Stay in chase
                }
            }
        } else {
            // No target found or target lost -> Wander (or Idle)
            desiredStrategyType = WanderStrategy; // Or IdleStrategy
            strategyKey = 'wander'; // Or 'idle'
            strategyConfig = this.config.wanderConfig; // Or idleConfig
        }

        // 3. Compare Current Strategy with Desired Strategy
        const currentStrategy = this.behaviorStrategyComponent.getCurrentStrategy();
        const currentStrategyType = currentStrategy ? currentStrategy.constructor : null;

        // Switch if the desired type is different from the current type
        if (desiredStrategyType && currentStrategyType !== desiredStrategyType) {
            console.log(`AIControllerComponent (${this.gameObject.name}): Requesting switch from ${currentStrategyType?.name ?? 'None'} to ${desiredStrategyType.name}`);

            // Use the factory to create the new strategy instance
            const newStrategy = this.strategyFactory.create(
                strategyKey,
                this.coreDependencies, // Pass the stored core dependencies
                strategyConfig        // Pass the specific config for this strategy
            );

            if (newStrategy) {
                this.behaviorStrategyComponent.setStrategy(newStrategy);
            } else {
                console.error(`AIControllerComponent (${this.gameObject.name}): Failed to create strategy instance for key '${strategyKey}'.`);
                // Fallback? Revert to idle?
                const idleStrategy = this.strategyFactory.create('idle', this.coreDependencies, this.config.idleConfig);
                if (idleStrategy) this.behaviorStrategyComponent.setStrategy(idleStrategy);
            }
        }
        // Optional: Handle case where strategy type is the same, but config needs update (e.g., target changed)
        // This might require strategies to have an `updateConfig` method or similar.
    }

    destroy(): void {
        this.behaviorStrategyComponent = null;
        this.target = null;
        // Release other references if necessary
    }
}
