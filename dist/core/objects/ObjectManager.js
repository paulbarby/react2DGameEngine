import { GameObject } from './GameObject.js'; // Added .js
// Import known component constructors
import { SpriteComponent } from '../components/SpriteComponent.js'; // Added .js
// Add other component imports here
export class ObjectManager {
    constructor() {
        this.gameObjects = new Map();
        this.objectsByLayer = new Map();
        // Registry to map string types to component constructors
        this.componentRegistry = new Map();
        // Pre-register known components
        this.registerComponent('SpriteComponent', SpriteComponent);
        // Register other components here
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
        for (const config of scene.objects) {
            // Create the GameObject instance
            const gameObject = new GameObject(config);
            // Store the GameObject
            if (this.gameObjects.has(gameObject.id)) {
                console.warn(`Duplicate GameObject ID "${gameObject.id}" detected in scene "${scene.name}". Overwriting.`);
            }
            this.gameObjects.set(gameObject.id, gameObject);
            // Add to layer map
            if (!this.objectsByLayer.has(config.layerId)) {
                this.objectsByLayer.set(config.layerId, []);
            }
            this.objectsByLayer.get(config.layerId).push(gameObject);
            // Create and add components
            for (const componentConfig of config.components) {
                const ComponentConstructor = this.componentRegistry.get(componentConfig.type);
                if (ComponentConstructor) {
                    try {
                        const componentInstance = new ComponentConstructor(componentConfig.properties);
                        gameObject.addComponent(componentInstance); // addComponent now calls init()
                    }
                    catch (error) {
                        console.error(`Error instantiating component "${componentConfig.type}" for GameObject "${gameObject.id}":`, error);
                    }
                }
                else {
                    console.error(`Component type "${componentConfig.type}" not registered. Cannot add to GameObject "${gameObject.id}".`);
                }
            }
            console.log(`Created GameObject: ${gameObject.name} (ID: ${gameObject.id}) with ${gameObject.components.length} components.`);
        }
        console.log(`Finished creating objects. Total: ${this.gameObjects.size}`);
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
    destroyObject(id) {
        const gameObject = this.gameObjects.get(id);
        if (gameObject) {
            // Find its layer ID before destroying
            let layerId = null;
            for (const [lId, objects] of this.objectsByLayer.entries()) {
                if (objects.includes(gameObject)) {
                    layerId = lId;
                    break;
                }
            }
            // Call destroy on the object (which destroys its components)
            gameObject.destroy();
            // Remove from main map
            this.gameObjects.delete(id);
            // Remove from layer map
            if (layerId) {
                const layerObjects = this.objectsByLayer.get(layerId);
                if (layerObjects) {
                    const index = layerObjects.indexOf(gameObject);
                    if (index > -1) {
                        layerObjects.splice(index, 1);
                    }
                }
            }
            console.log(`Object ${id} removed from ObjectManager.`);
        }
        else {
            console.warn(`Attempted to destroy non-existent object with ID: ${id}`);
        }
    }
    clearAllObjects() {
        console.log(`Clearing all ${this.gameObjects.size} objects.`);
        // Important: Iterate over a copy of keys/values if destroyObject modifies the map during iteration
        const idsToDestroy = Array.from(this.gameObjects.keys());
        for (const id of idsToDestroy) {
            // Use destroyObject to ensure proper cleanup from both maps
            this.destroyObject(id);
        }
        // Double check maps are empty
        if (this.gameObjects.size > 0 || Array.from(this.objectsByLayer.values()).some(arr => arr.length > 0)) {
            console.error("Failed to clear all objects properly!");
            this.gameObjects.clear();
            this.objectsByLayer.clear();
        }
        else {
            console.log("All objects cleared.");
        }
    }
}
