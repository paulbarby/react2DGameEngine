import { IGameObject, IComponent } from '../../types/core.js';
import { GameObjectConfig } from '../../types/project.js';

export class GameObject implements IGameObject {
    public readonly id: string;
    public name: string;
    public type: string; // Added type property
    public x: number;
    public y: number;
    public rotation: number = 0; // Default rotation
    public scaleX: number = 1;   // Default scale
    public scaleY: number = 1;   // Default scale
    public layerId: string;      // Added layerId property
    public readonly components: IComponent[] = []; // Make components array readonly externally via interface

    constructor(config: GameObjectConfig) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type; // Initialize type from config
        this.x = config.x;
        this.y = config.y;
        this.layerId = config.layerId; // Initialize layerId from config
        // Components are added by ObjectManager after construction
    }

    update(deltaTime: number): void {
        for (const component of this.components) {
            component.update(deltaTime);
        }
    }

    addComponent(component: IComponent): void {
        this.components.push(component);
        component.gameObject = this;
        // Defer init call to ObjectManager after all components might be added?
        // Or call it here? Plan says call here.
        component.init();
    }

    getComponent<T extends IComponent>(typeConstructor: { new(...args: any[]): T }): T | undefined {
        for (const component of this.components) {
            if (component instanceof typeConstructor) {
                return component as T;
            }
        }
        return undefined;
    }

    destroy(): void {
        console.log(`Destroying GameObject: ${this.name} (${this.id})`);
        // Call destroy on each component first
        // Iterate backwards to safely remove/handle dependencies if needed
        for (let i = this.components.length - 1; i >= 0; i--) {
            try {
                this.components[i].destroy();
            } catch (error) {
                 console.error(`Error destroying component on ${this.name}:`, error);
            }
        }
        // Clear the array by setting its length to 0, instead of reassigning
        this.components.length = 0;
    }
}
