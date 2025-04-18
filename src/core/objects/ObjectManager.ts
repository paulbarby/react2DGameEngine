import { IGameObject, IComponent } from '../../types/core.js'; // Added .js
import { Scene, GameObjectConfig } from '../../types/project.js'; // Added .js
import { GameObject } from './GameObject.js'; // Added .js
// Import known component constructors
import { SpriteComponent } from '../components/SpriteComponent.js'; // Added .js
import { AssetLoader } from '../assets/AssetLoader.js'; // Import AssetLoader
// Add other component imports here

export class ObjectManager {
    private gameObjects: Map<string, IGameObject> = new Map();
    private objectsByLayer: Map<string, IGameObject[]> = new Map();
    // Registry to map string types to component constructors
    private componentRegistry: Map<string, new (config: any) => IComponent> = new Map();
    private assetLoader: AssetLoader | null = null; // Store AssetLoader reference

    constructor() {
        // Pre-register known components
        this.registerComponent('SpriteComponent', SpriteComponent);
        // Register other components here
    }

    // Method to set the AssetLoader, called after it's created
    setAssetLoader(loader: AssetLoader): void {
        this.assetLoader = loader;
    }

    registerComponent(type: string, constructor: new (config: any) => IComponent): void {
        if (this.componentRegistry.has(type)) {
            console.warn(`Component type "${type}" is already registered. Overwriting.`);
        }
        this.componentRegistry.set(type, constructor);
        console.log(`Component type "${type}" registered.`);
    }

    createObjectsForScene(scene: Scene): void {
        this.clearAllObjects();
        console.log(`Creating objects for scene: ${scene.name}`);
        scene.objects.forEach(config => this.createObjectFromConfig(config)); // Use the new method
        console.log(`Finished creating ${this.gameObjects.size} objects for scene.`);
    }

    /**
     * Creates a single GameObject from its configuration, adds its components,
     * and registers it with the manager.
     * @param config The configuration for the GameObject.
     * @returns The created GameObject or null if creation failed.
     */
    createObjectFromConfig(config: GameObjectConfig): IGameObject | null {
        if (this.gameObjects.has(config.id)) {
            console.warn(`ObjectManager: Object with ID "${config.id}" already exists. Skipping creation.`);
            return this.gameObjects.get(config.id) || null;
        }

        try {
            const gameObject = new GameObject(config);

            // Add components
            for (const componentConfig of config.components) {
                const ComponentConstructor = this.componentRegistry.get(componentConfig.type);
                if (ComponentConstructor) {
                    // Prepare properties, potentially adding common dependencies
                    const props: { [key: string]: any } = { // Add index signature to allow string keys
                        ...componentConfig.properties,
                        // Inject common dependencies if the component needs them
                        assetLoader: this.assetLoader,
                        objectManager: this,
                        // Only add inputManager if it was originally in properties
                        // This avoids adding 'inputManager: undefined' if it wasn't there
                        ...(componentConfig.properties.inputManager && { inputManager: componentConfig.properties.inputManager })
                    };

                    // Filter out properties that are explicitly undefined
                    // (Handles cases where inputManager might be undefined in the original config)
                    Object.keys(props).forEach(key => {
                        if (props[key] === undefined) {
                            delete props[key];
                        }
                    });

                    const componentInstance = new ComponentConstructor(props);
                    gameObject.addComponent(componentInstance);
                } else {
                    console.error(`ObjectManager: Unknown component type "${componentConfig.type}" for object "${config.name}". Skipping component.`);
                }
            }

            // Store the object
            this.gameObjects.set(gameObject.id, gameObject);

            // Add to layer map
            if (!this.objectsByLayer.has(gameObject.layerId)) {
                this.objectsByLayer.set(gameObject.layerId, []);
            }
            this.objectsByLayer.get(gameObject.layerId)!.push(gameObject);

            console.log(`ObjectManager created: ${gameObject.name} (${gameObject.id})`);
            return gameObject;

        } catch (error) {
            console.error(`ObjectManager: Failed to create object "${config.name}" (ID: ${config.id}):`, error);
            return null;
        }
    }

    update(deltaTime: number): void {
        // Using values().forEach is okay, but a for...of loop is also clear
        for (const gameObject of this.gameObjects.values()) {
            gameObject.update(deltaTime);
        }
    }

    getObjectById(id: string): IGameObject | undefined {
        return this.gameObjects.get(id);
    }

    getObjectsByLayer(layerId: string): ReadonlyArray<IGameObject> {
        // Return a readonly version or a copy to prevent external modification
        return this.objectsByLayer.get(layerId) || [];
    }

    getAllObjects(): IterableIterator<IGameObject> {
        return this.gameObjects.values();
    }

    destroyObject(id: string): void {
        const object = this.gameObjects.get(id);
        if (object) {
            object.destroy(); // Call object's internal destroy logic (destroys components)

            // Remove from main map
            this.gameObjects.delete(id);

            // Remove from layer map
            const layerArray = this.objectsByLayer.get(object.layerId);
            if (layerArray) {
                const index = layerArray.indexOf(object);
                if (index > -1) {
                    layerArray.splice(index, 1);
                }
                // Optional: delete layer entry if array becomes empty
                // if (layerArray.length === 0) {
                //     this.objectsByLayer.delete(object.layerId);
                // }
            }
            console.log(`ObjectManager destroyed and removed: ${object.name} (${id})`);
        } else {
            console.warn(`ObjectManager: Attempted to destroy non-existent object with id: ${id}`);
        }
    }

    clearAllObjects(): void {
        // Iterate over values and call destroyObject to ensure proper cleanup
        const ids = Array.from(this.gameObjects.keys());
        ids.forEach(id => this.destroyObject(id));

        // Explicitly clear maps just in case (though destroyObject should handle it)
        this.gameObjects.clear();
        this.objectsByLayer.clear();
        console.log("ObjectManager cleared all objects.");
    }
}
