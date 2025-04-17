export class GameObject {
    constructor(config) {
        this.components = []; // Use array for order if needed
        this.id = config.id;
        this.name = config.name;
        this.x = config.x;
        this.y = config.y;
        this.rotation = 0; // Default rotation
        this.scaleX = 1; // Default scale
        this.scaleY = 1; // Default scale
        // Components are added by ObjectManager after construction
    }
    update(deltaTime) {
        for (const component of this.components) {
            component.update(deltaTime);
        }
    }
    addComponent(component) {
        this.components.push(component);
        component.gameObject = this;
        // Defer init call to ObjectManager after all components might be added?
        // Or call it here? Plan says call here.
        component.init();
    }
    getComponent(typeConstructor) {
        for (const component of this.components) {
            if (component instanceof typeConstructor) {
                return component;
            }
        }
        return undefined;
    }
    destroy() {
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
