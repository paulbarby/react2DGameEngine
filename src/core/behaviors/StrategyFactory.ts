import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IdleStrategy } from './IdleStrategy.js';
import { WanderStrategy } from './WanderStrategy.js';
import { ChaseStrategy } from './ChaseStrategy.js';
import { FleeStrategy } from './FleeStrategy.js'; // Import FleeStrategy
import { AttackStrategy } from './AttackStrategy.js'; // Import AttackStrategy
import { EventBus } from '../events/EventBus.js'; // Import EventBus type
import { ObjectManager } from '../objects/ObjectManager.js'; // Import ObjectManager type
// Import other strategy classes as they are created

// Define the expected structure for dependencies that strategies might need
// Make properties optional, strategies should check for required ones.
export interface StrategyDependencies { // Add export
    objectManager?: ObjectManager;
    soundManager?: any;  // Replace 'any' with actual SoundManager type
    eventBus?: EventBus;
    assetLoader?: any; // Replace 'any' with actual AssetLoader type
    // Add other potential dependencies like InputManager etc.
}

// Type for the constructor signature of a strategy class
type StrategyConstructor = new (dependencies: StrategyDependencies, config?: any) => IUpdateStrategy;

/**
 * A factory/registry for creating instances of different IUpdateStrategy classes.
 * This allows strategies to be instantiated based on configuration strings and
 * handles injecting necessary dependencies.
 */
export class StrategyFactory {
    private static registry: Map<string, StrategyConstructor> = new Map();

    /**
     * Registers a strategy class constructor with a unique key.
     * @param key A string identifier for the strategy (e.g., 'idle', 'wander', 'chasePlayer').
     * @param constructor The strategy class constructor.
     */
    public static register(key: string, constructor: StrategyConstructor): void {
        if (this.registry.has(key)) {
            console.warn(`StrategyFactory: Overwriting registration for key '${key}'.`);
        }
        this.registry.set(key, constructor);
        console.log(`StrategyFactory: Registered strategy '${key}'.`);
    }

    /**
     * Creates an instance of a registered strategy.
     * @param key The string identifier of the strategy to create.
     * @param dependencies An object containing dependencies needed by the strategy (e.g., { objectManager, soundManager, eventBus }).
     * @param config Optional configuration object specific to the strategy being created.
     * @returns An instance of the requested IUpdateStrategy, or null if the key is not registered.
     */
    public static create(key: string, dependencies: StrategyDependencies, config?: any): IUpdateStrategy | null {
        const Constructor = this.registry.get(key);
        if (!Constructor) {
            console.error(`StrategyFactory: No strategy registered for key '${key}'.`);
            return null;
        }

        try {
            // Instantiate the strategy, passing dependencies and config
            const strategyInstance = new Constructor(dependencies, config);
            console.log(`StrategyFactory: Created instance of '${key}'.`);
            return strategyInstance;
        } catch (error) {
            console.error(`StrategyFactory: Error creating instance of '${key}':`, error);
            return null;
        }
    }

    /**
     * Checks if a strategy key is registered.
     * @param key The strategy key.
     * @returns True if the key is registered, false otherwise.
     */
    public static has(key: string): boolean {
        return this.registry.has(key);
    }
}

// --- Register Default Strategies ---
// Register the strategies immediately so they are available.
// Pass the actual class constructors.
StrategyFactory.register('idle', IdleStrategy);
StrategyFactory.register('wander', WanderStrategy);
StrategyFactory.register('chase', ChaseStrategy);
StrategyFactory.register('flee', FleeStrategy); // Register FleeStrategy
StrategyFactory.register('attack', AttackStrategy); // Register AttackStrategy
// StrategyFactory.register('other', OtherStrategy);
