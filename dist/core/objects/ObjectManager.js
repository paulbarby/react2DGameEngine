import { GameObject } from './GameObject.js'; // Added .js
// Import known component constructors
import { SpriteComponent } from '../components/SpriteComponent.js'; // Added .js
import { createGameObjectEvent } from '../events/EventTypes.js'; // Import event creator
// Add other component imports here
export class ObjectManager {
    constructor() {
        this.gameObjects = new Map();
        this.objectsByLayer = new Map();
        // Registry to map string types to component constructors
        this.componentRegistry = new Map();
        this.assetLoader = null; // Store AssetLoader reference
        this.eventBus = null; // Store EventBus reference
        // Pre-register known components
        this.registerComponent('SpriteComponent', SpriteComponent);
        // Register other components here
    }
    // Method to set the AssetLoader, called after it's created
    setAssetLoader(loader) {
        this.assetLoader = loader;
    }
    // Method to set the EventBus
    setEventBus(eventBus) {
        this.eventBus = eventBus;
    }
    registerComponent(type, constructor) {
        if (this.componentRegistry.has(type)) {
            console.warn(`Component type "${type}" is already registered. Overwriting.`);
        }
        this.componentRegistry.set(type, constructor);
        console.log(`Component type "${type}" registered.`);
    }
    createObjectsForScene(scene) {
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
    createObjectFromConfig(config) {
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
                    const props = Object.assign(Object.assign(Object.assign({}, componentConfig.properties), { 
                        // Inject common dependencies if the component needs them
                        assetLoader: this.assetLoader, objectManager: this, eventBus: this.eventBus }), (componentConfig.properties.inputManager && { inputManager: componentConfig.properties.inputManager }));
                    // Filter out properties that are explicitly undefined
                    // (Handles cases where inputManager might be undefined in the original config)
                    Object.keys(props).forEach(key => {
                        if (props[key] === undefined) {
                            delete props[key];
                        }
                    });
                    const componentInstance = new ComponentConstructor(props);
                    gameObject.addComponent(componentInstance);
                }
                else {
                    console.error(`ObjectManager: Unknown component type "${componentConfig.type}" for object "${config.name}". Skipping component.`);
                }
            }
            // Store the object
            this.gameObjects.set(gameObject.id, gameObject);
            // Add to layer map
            if (!this.objectsByLayer.has(gameObject.layerId)) {
                this.objectsByLayer.set(gameObject.layerId, []);
            }
            this.objectsByLayer.get(gameObject.layerId).push(gameObject);
            console.log(`ObjectManager created: ${gameObject.name} (${gameObject.id})`);
            // Publish event
            if (this.eventBus) {
                this.eventBus.publish(createGameObjectEvent('gameObjectCreated', gameObject));
            }
            return gameObject;
        }
        catch (error) {
            console.error(`ObjectManager: Failed to create object "${config.name}" (ID: ${config.id}):`, error);
            return null;
        }
    }
    update(deltaTime) {
        // Using values().forEach is okay, but a for...of loop is also clear
        for (const gameObject of this.gameObjects.values()) {
            gameObject.update(deltaTime);
        }
    }
    getObjectById(id) {
        return this.gameObjects.get(id);
    }
    getObjectsByLayer(layerId) {
        // Return a readonly version or a copy to prevent external modification
        return this.objectsByLayer.get(layerId) || [];
    }
    getAllObjects() {
        return this.gameObjects.values();
    }
    destroyObject(id) {
        const object = this.gameObjects.get(id);
        if (object) {
            // Publish event BEFORE destroying
            if (this.eventBus) {
                this.eventBus.publish(createGameObjectEvent('gameObjectDestroyed', object));
            }
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
        }
        else {
            console.warn(`ObjectManager: Attempted to destroy non-existent object with id: ${id}`);
        }
    }
    clearAllObjects() {
        // Iterate over values and call destroyObject to ensure proper cleanup
        // destroyObject will publish the events
        const ids = Array.from(this.gameObjects.keys());
        ids.forEach(id => this.destroyObject(id));
        // Explicitly clear maps just in case (though destroyObject should handle it)
        this.gameObjects.clear();
        this.objectsByLayer.clear();
        console.log("ObjectManager cleared all objects.");
    }
}
