import { IGameObject, IComponent } from '../../types/core.js';
import { GameObjectConfig } from '../../types/project.js';

export class GameObject implements IGameObject {
    public readonly id: string;
    public name: string;
    public x: number;
    public y: number;
    public rotation: number = 0; // Default rotation
    public scaleX: number = 1;   // Default scale
    public scaleY: number = 1;   // Default scale
    public layerId: string;      // Added layerId property
    public components: IComponent[] = []; // Use array for order if needed

    constructor(config: GameObjectConfig) {
        this.id = config.id;
        this.name = config.name;
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
        // Call destroy on components in reverse order of addition? Or forward?
        // Forward seems simpler.
        for (const component of this.components) {
            component.destroy();
            component.gameObject = null; // Break reference
        }
        this.components = []; // Clear the array
        // Any other cleanup specific to the GameObject itself
        console.log(`GameObject ${this.id} (${this.name}) destroyed.`);
    }
}
