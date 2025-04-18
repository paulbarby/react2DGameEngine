export class GameObject {
    constructor(config) {
        this.rotation = 0; // Default rotation
        this.scaleX = 1; // Default scale
        this.scaleY = 1; // Default scale
        this.components = []; // Make components array readonly externally via interface
        this.id = config.id;
        this.name = config.name;
        this.type = config.type; // Initialize type from config
        this.x = config.x;
        this.y = config.y;
        this.layerId = config.layerId; // Initialize layerId from config
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
        console.log(`Destroying GameObject: ${this.name} (${this.id})`);
        // Call destroy on each component first
        // Iterate backwards to safely remove/handle dependencies if needed
        for (let i = this.components.length - 1; i >= 0; i--) {
            try {
                this.components[i].destroy();
            }
            catch (error) {
                console.error(`Error destroying component on ${this.name}:`, error);
            }
        }
        // Clear the array by setting its length to 0, instead of reassigning
        this.components.length = 0;
    }
}
