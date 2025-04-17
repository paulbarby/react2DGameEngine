import { BaseComponent } from './BaseComponent.js';
import { SpriteComponent } from './SpriteComponent.js'; // Needed for height

interface EnemyMovementProps {
    speed: number;
    bounds: { width: number, height: number }; // Canvas dimensions
}

export class EnemyMovementComponent extends BaseComponent {
    private speed: number;
    private bounds: { width: number, height: number };

    constructor(config: EnemyMovementProps) {
        super();
        this.speed = config.speed;
        this.bounds = config.bounds;
    }

    init(): void {
        console.log(`EnemyMovementComponent initialized for ${this.gameObject?.name}`);
    }

    update(deltaTime: number): void {
        if (!this.gameObject) return;

        this.gameObject.y += this.speed * deltaTime;

        // Wrap around when off-screen (bottom to top)
        const spriteComp = this.gameObject.getComponent(SpriteComponent);
        const height = spriteComp?.height || 32; // Default height if no sprite

        if (this.gameObject.y > this.bounds.height + height / 2) {
            this.gameObject.y = -height / 2; // Reset position above the screen
            // Optional: Randomize X position when wrapping
            this.gameObject.x = Math.random() * this.bounds.width;
        }
    }

    destroy(): void {
        console.log(`EnemyMovementComponent destroyed for ${this.gameObject?.name}`);
    }
}
