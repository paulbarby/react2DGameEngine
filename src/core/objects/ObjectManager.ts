import { IGameObject, IComponent } from '../../types/core.js';
import { GameObjectConfig, ComponentConfig, Scene } from '../../types/project.js';
import { GameObject } from './GameObject.js';
import * as Components from '../components/index.js'; // Import all components
import { AssetLoader } from '../assets/AssetLoader.js';
import { EventBus } from '../events/EventBus.js';
import { createGameObjectEvent } from '../events/EventTypes.js';
import { StrategyFactory } from '../behaviors/StrategyFactory.js'; // Import StrategyFactory
import { BehaviorStrategyComponent } from '../components/BehaviorStrategyComponent.js'; // Import component type
import { AIControllerComponent } from '../components/AIControllerComponent.js'; // Import AIControllerComponent
import { InputManager } from '../input/InputManager.js'; // Import InputManager
import { SoundManager } from '../sound/SoundManager.js'; // Import SoundManager (assuming path)
import { info, warn, error, debug } from '../utils/logger.js'; // Import logger functions

// Define the structure for dependencies that ObjectManager can provide
interface CoreDependencies {
    objectManager: ObjectManager;
    assetLoader?: AssetLoader;
    eventBus?: EventBus;
    soundManager?: SoundManager; // Add SoundManager
    inputManager?: InputManager; // Add InputManager
    // Add other core systems as needed
}

export class ObjectManager {
    private gameObjects: Map<string, IGameObject> = new Map();
    private objectsByLayer: Map<string, IGameObject[]> = new Map();
    private componentRegistry: Map<string, new (config: any) => IComponent> = new Map();
    private assetLoader: AssetLoader | null = null; // To pass to components if needed
    private eventBus: EventBus | null = null; // To pass to components and for internal events
    private coreDependencies: CoreDependencies; // Store dependencies for strategies

    constructor() {
        // Register default components
        this.registerComponent('SpriteComponent', Components.SpriteComponent);
        this.registerComponent('PlayerControllerComponent', Components.PlayerControllerComponent);
        this.registerComponent('EnemyMovementComponent', Components.EnemyMovementComponent);
        this.registerComponent('CollisionComponent', Components.CollisionComponent);
        this.registerComponent('PlayerShootingComponent', Components.PlayerShootingComponent);
        this.registerComponent('BulletMovementComponent', Components.BulletMovementComponent);
        this.registerComponent('AnimationComponent', Components.AnimationComponent);
        this.registerComponent('ExplosionCompletionComponent', Components.ExplosionCompletionComponent);
        this.registerComponent('BehaviorStrategyComponent', Components.BehaviorStrategyComponent); // Register the new component
        this.registerComponent('AIControllerComponent', Components.AIControllerComponent); // Register AIControllerComponent

        // Initialize core dependencies container
        this.coreDependencies = {
            objectManager: this
            // Other dependencies will be added via setters
        };
    }

    setAssetLoader(assetLoader: AssetLoader): void {
        this.assetLoader = assetLoader;
        this.coreDependencies.assetLoader = assetLoader; // Add to dependencies
    }

    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
        this.coreDependencies.eventBus = eventBus; // Add to dependencies
    }

    // Add setter for SoundManager when it's integrated
    setSoundManager(soundManager: SoundManager): void {
        this.coreDependencies.soundManager = soundManager;
    }

    setInputManager(inputManager: InputManager): void {
        this.coreDependencies.inputManager = inputManager;
    }

    registerComponent(type: string, constructor: new (config: any) => IComponent): void {
        if (this.componentRegistry.has(type)) {
            warn(`ObjectManager: Overwriting component registration for type '${type}'.`); // Use logger
        }
        this.componentRegistry.set(type, constructor);
        info(`ObjectManager: Registered component type '${type}'.`); // Use logger
    }

    createObjectsForScene(scene: Scene): void {
        this.clearAllObjects();
        info(`ObjectManager: Creating objects for scene '${scene.name}'...`); // Use logger

        for (const config of scene.objects) {
            this.createObject(config); // Use the new createObject method
        }
        info(`ObjectManager: Finished creating ${scene.objects.length} objects.`); // Use logger
    }

    /**
     * Creates a single GameObject from configuration, adds it to the manager,
     * initializes its components, and publishes a creation event.
     * @param config The configuration for the GameObject.
     * @returns The created GameObject instance, or null if creation failed.
     */
    createObject(config: GameObjectConfig): IGameObject | null {
        try {
            info(`Creating object: ${config.name} (ID: ${config.id})`); // Use logger
            const gameObject = new GameObject(config);

            // Add to main map
            this.gameObjects.set(gameObject.id, gameObject);

            // Add to layer map
            if (!this.objectsByLayer.has(config.layerId)) {
                this.objectsByLayer.set(config.layerId, []);
            }
            this.objectsByLayer.get(config.layerId)?.push(gameObject);

            // Create and add components
            for (const componentConfig of config.components) {
                const ComponentConstructor = this.componentRegistry.get(componentConfig.type);
                if (ComponentConstructor) {
                    // Inject dependencies needed by specific components
                    const props = { ...componentConfig.properties };
                    if (componentConfig.type === 'AnimationComponent') {
                        props.assetLoader = this.assetLoader; // Inject AssetLoader
                    }
                    if (componentConfig.type === 'BulletMovementComponent') {
                        props.objectManager = this; // Inject ObjectManager
                    }
                    // --- Strategy Component Handling ---
                    if (componentConfig.type === 'BehaviorStrategyComponent') {
                        props.dependencies = this.coreDependencies;
                    }
                    // --- AI Controller Component Handling ---
                    if (componentConfig.type === 'AIControllerComponent') {
                        props.dependencies = this.coreDependencies;
                    }
                    // --- Player Shooting Component Handling ---
                    if (componentConfig.type === 'PlayerShootingComponent') {
                        // Pass necessary dependencies if not already in prefab config
                        props.objectManager = this;
                        props.soundManager = this.coreDependencies.soundManager;
                        props.inputManager = this.coreDependencies.inputManager; // Assuming inputManager is added to coreDependencies
                    }
                    // --- Player Controller Component Handling ---
                    if (componentConfig.type === 'PlayerControllerComponent') {
                        // <<< START DIAGNOSTIC LOGGING >>>
                        debug(`ObjectManager: Injecting dependencies for PlayerControllerComponent on ${config.name}.`); // Use logger
                        debug(`  -> Checking this.coreDependencies.inputManager:`, this.coreDependencies.inputManager ? 'EXISTS' : 'MISSING'); // Use logger
                        // <<< END DIAGNOSTIC LOGGING >>>
                        props.inputManager = this.coreDependencies.inputManager; // Inject InputManager
                        // <<< START DIAGNOSTIC LOGGING >>>
                        debug(`  -> Props object after injection:`, props); // Use logger
                        // <<< END DIAGNOSTIC LOGGING >>>
                    }
                    // --- Explosion Completion Component Handling ---
                    if (componentConfig.type === 'ExplosionCompletionComponent') {
                        // <<< START DIAGNOSTIC LOGGING >>>
                        debug(`ObjectManager: Injecting dependencies for ExplosionCompletionComponent on ${config.name}.`); // Use logger
                        debug(`  -> Checking this.coreDependencies.objectManager:`, this.coreDependencies.objectManager ? 'EXISTS' : 'MISSING'); // Use logger
                        // <<< END DIAGNOSTIC LOGGING >>>
                        props.objectManager = this.coreDependencies.objectManager;
                        // <<< START DIAGNOSTIC LOGGING >>>
                        debug(`  -> Props object after injection:`, props); // Use logger
                        // <<< END DIAGNOSTIC LOGGING >>>
                    }
                    // --- End Component Handling ---

                    const componentInstance = new ComponentConstructor(props);

                    // --- Inject StrategyFactory into BehaviorStrategyComponent ---
                    if (componentInstance instanceof BehaviorStrategyComponent) {
                        componentInstance.setStrategyFactory(StrategyFactory);
                    }
                    // --- End Inject StrategyFactory ---

                    gameObject.addComponent(componentInstance); // This calls component.init()
                    debug(`  Added component: ${componentConfig.type}`); // Use logger (debug level)

                } else {
                    error(`Component type "${componentConfig.type}" not registered for object ${config.name}.`); // Use logger
                    // Optionally remove the partially created object if a component fails
                    // this.destroyObject(gameObject.id);
                    // return null;
                }
            }
            // Publish event after object and all components are created and initialized
            if (this.eventBus) {
                this.eventBus.publish(createGameObjectEvent('gameObjectCreated', gameObject));
            }
            return gameObject; // Return the created object
        } catch (err) { // Use different variable name
            error(`Error creating object ${config.name} (ID: ${config.id}):`, err); // Use logger
            // Clean up if object was partially added
            if (this.gameObjects.has(config.id)) {
                this.destroyObject(config.id);
            }
            return null; // Indicate failure
        }
    }

    // ... update, getObjectById, getObjectsByLayer methods ...
    update(deltaTime: number): void {
        // Create a copy of the values to iterate over, allowing objects to be destroyed during update
        const objectsToUpdate = Array.from(this.gameObjects.values());
        for (const gameObject of objectsToUpdate) {
            // Check if the object still exists in the map before updating
            if (this.gameObjects.has(gameObject.id)) {
                gameObject.update(deltaTime);
            }
        }
    }

    getObjectById(id: string): IGameObject | undefined {
        return this.gameObjects.get(id);
    }

    getObjectsByLayer(layerId: string): IGameObject[] {
        return this.objectsByLayer.get(layerId) || [];
    }

    getAllObjects(): IterableIterator<IGameObject> {
        return this.gameObjects.values();
    }

    destroyObject(id: string): void {
        const gameObject = this.gameObjects.get(id);
        if (gameObject) {
            info(`ObjectManager: Destroying object ${gameObject.name} (ID: ${id})`); // Use logger
            // Publish event BEFORE actual destruction
            if (this.eventBus) {
                this.eventBus.publish(createGameObjectEvent('gameObjectDestroyed', gameObject));
            }

            // Remove from layer map
            const layerId = gameObject.layerId;
            const layerObjects = this.objectsByLayer.get(layerId);
            if (layerObjects) {
                const index = layerObjects.indexOf(gameObject);
                if (index > -1) {
                    layerObjects.splice(index, 1);
                }
            }

            // Call object's destroy method (which destroys components)
            gameObject.destroy();

            // Remove from main map
            this.gameObjects.delete(id);
        } else {
            warn(`ObjectManager: Attempted to destroy non-existent object with ID: ${id}`); // Use logger
        }
    }

    clearAllObjects(): void {
        info(`ObjectManager: Clearing all ${this.gameObjects.size} objects.`); // Use logger
        // Create a copy of IDs to avoid issues while iterating and deleting
        const objectIds = Array.from(this.gameObjects.keys());
        for (const id of objectIds) {
            this.destroyObject(id); // Use destroyObject to ensure proper cleanup and event publishing
        }
        // Double-check maps are empty
        this.gameObjects.clear();
        this.objectsByLayer.clear();
    }
}
