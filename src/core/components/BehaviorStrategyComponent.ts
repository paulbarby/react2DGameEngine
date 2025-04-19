import { BaseComponent } from './BaseComponent.js';
import { IUpdateStrategy } from '../behaviors/IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
// Import the factory/registry when it's created
// import { StrategyFactory } from '../behaviors/StrategyFactory.js';

/**
 * Configuration properties for the BehaviorStrategyComponent.
 */
interface BehaviorStrategyComponentProps {
    /**
     * Optional: The key (string identifier) of the initial strategy to use when the component is created.
     * This key will be used with a StrategyFactory/Registry to instantiate the actual strategy object.
     */
    initialStrategyKey?: string;

    /**
     * Optional: Additional configuration data specific to the initial strategy.
     * This object will be passed to the StrategyFactory when creating the initial strategy instance.
     */
    initialStrategyConfig?: any;

    /**
     * Optional: A map of dependencies that might be required by the strategies.
     * These dependencies (e.g., ObjectManager, SoundManager) will be passed to the
     * StrategyFactory during strategy creation.
     * Example: { objectManager: ObjectManager, soundManager: SoundManager }
     */
    dependencies?: { [key: string]: any };
}

/**
 * A component that manages and executes the current update behavior (strategy) for a GameObject.
 * It allows swapping the GameObject's behavior dynamically by changing the active IUpdateStrategy.
 */
export class BehaviorStrategyComponent extends BaseComponent {
    private currentStrategy: IUpdateStrategy | null = null;
    // Store config for potential re-creation or factory use
    private config: BehaviorStrategyComponentProps;
    // Reference to the factory (will be set via ObjectManager or similar)
    private strategyFactory: /* StrategyFactory */ any | null = null; // Replace 'any' with actual factory type

    constructor(config: BehaviorStrategyComponentProps) {
        super();
        this.config = config;
        // Initial strategy instantiation will happen in init() after the factory is potentially available.
    }

    // Method to inject the factory (called by ObjectManager during component creation)
    setStrategyFactory(factory: /* StrategyFactory */ any): void {
        this.strategyFactory = factory;
    }

    init(): void {
        // Instantiate the initial strategy using the factory if provided
        if (this.config.initialStrategyKey && this.strategyFactory) {
            console.log(`BehaviorStrategyComponent (${this.gameObject?.name}): Attempting to create initial strategy '${this.config.initialStrategyKey}'`);
            const newStrategy = this.strategyFactory.create(
                this.config.initialStrategyKey,
                this.config.dependencies, // Pass dependencies provided in config
                this.config.initialStrategyConfig // Pass strategy-specific config
            );
            if (newStrategy) {
                this.setStrategy(newStrategy, true); // Set initial strategy, skip onExit
            } else {
                console.error(`BehaviorStrategyComponent (${this.gameObject?.name}): Failed to create initial strategy with key '${this.config.initialStrategyKey}'`);
            }
        } else if (this.config.initialStrategyKey) {
             console.warn(`BehaviorStrategyComponent (${this.gameObject?.name}): initialStrategyKey '${this.config.initialStrategyKey}' provided, but no StrategyFactory available.`);
        } else {
             console.log(`BehaviorStrategyComponent (${this.gameObject?.name}): Initialized without an initial strategy.`);
        }
    }

    update(deltaTime: number): void {
        // Delegate update to the current strategy if one is active
        if (this.currentStrategy && this.gameObject) {
            try {
                this.currentStrategy.update(this.gameObject, deltaTime);
            } catch (e) {
                 console.error(`Error during ${this.currentStrategy.constructor.name}.update for ${this.gameObject?.name}:`, e);
                 // Optional: Consider setting strategy to null or an error state strategy
            }
        }
    }

    /**
     * Sets the active update strategy for the GameObject.
     * Handles calling onExit for the old strategy and onEnter for the new one.
     * @param newStrategy The new strategy instance, or null to stop behavior.
     * @param isInitialSet Internal flag to skip onExit during initialization.
     */
    setStrategy(newStrategy: IUpdateStrategy | null, isInitialSet: boolean = false): void {
        if (this.currentStrategy === newStrategy) {
            return; // No change needed
        }

        const oldStrategyName = this.currentStrategy?.constructor.name ?? 'None';
        const newStrategyName = newStrategy?.constructor.name ?? 'None';
        console.log(`BehaviorStrategyComponent (${this.gameObject?.name}): Switching strategy: ${oldStrategyName} -> ${newStrategyName}`);

        // Call onExit on the outgoing strategy (unless it's the initial setup)
        if (!isInitialSet && this.currentStrategy?.onExit && this.gameObject) {
            try {
                this.currentStrategy.onExit(this.gameObject);
            } catch (e) {
                console.error(`Error during ${oldStrategyName}.onExit for ${this.gameObject?.name}:`, e);
            }
        }

        // Update the reference
        this.currentStrategy = newStrategy;

        // Call onEnter on the incoming strategy
        if (this.currentStrategy?.onEnter && this.gameObject) {
             try {
                this.currentStrategy.onEnter(this.gameObject);
            } catch (e) {
                console.error(`Error during ${newStrategyName}.onEnter for ${this.gameObject?.name}:`, e);
            }
        }
    }

    /**
     * Gets the currently active strategy instance.
     * @returns The current IUpdateStrategy or null if none is active.
     */
    getCurrentStrategy(): IUpdateStrategy | null {
        return this.currentStrategy;
    }

    destroy(): void {
        const strategyName = this.currentStrategy?.constructor.name ?? 'None';
        console.log(`BehaviorStrategyComponent (${this.gameObject?.name}): Destroying. Cleaning up strategy: ${strategyName}`);
        // Ensure onExit is called for the final strategy
        if (this.currentStrategy?.onExit && this.gameObject) {
             try {
                this.currentStrategy.onExit(this.gameObject);
            } catch (e) {
                console.error(`Error during final ${strategyName}.onExit for ${this.gameObject?.name}:`, e);
            }
        }
        this.currentStrategy = null;
        this.strategyFactory = null; // Release factory reference
        this.config = {}; // Clear config
    }
}
