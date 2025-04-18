import { BaseComponent } from './BaseComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Needed to destroy self

interface BulletMovementProps {
    speed: number;
    objectManager: ObjectManager; // Pass ObjectManager
    bounds: { top: number }; // Upper boundary for removal
}

export class BulletMovementComponent extends BaseComponent {
    private speed: number;
    private objectManager: ObjectManager;
    private boundsTop: number;

    constructor(config: BulletMovementProps) {
        super();
        this.speed = config.speed;
        this.objectManager = config.objectManager;
        this.boundsTop = config.bounds.top;
    }

    init(): void {
        // Optional: Log initialization
        // console.log(`BulletMovementComponent initialized for ${this.gameObject?.name}`);
    }

    update(deltaTime: number): void {
        if (!this.gameObject) return;

        // <<< ENSURE THIS LOG IS PRESENT >>>
        console.log(`BulletMovementComponent UPDATE called for ${this.gameObject.id}, deltaTime: ${deltaTime.toFixed(4)}`);

        const oldY = this.gameObject.y; // Store old position
        this.gameObject.y -= this.speed * deltaTime;
        // console log speed and deltaTime for debugging
        console.log(`Bullet ${this.gameObject.id} speed: ${this.speed}, deltaTime: ${deltaTime}`);

        // <<< ADD LOG HERE to see if update is called and position changes
        console.log(`Bullet ${this.gameObject.id} update: oldY=${oldY.toFixed(1)}, newY=${this.gameObject.y.toFixed(1)}, deltaY=${(this.gameObject.y - oldY).toFixed(1)}, deltaTime=${deltaTime.toFixed(4)}`);

        // Check if bullet is out of bounds (top)
        if (this.gameObject.y < this.boundsTop) {
            console.log(`Destroying bullet ${this.gameObject.id} (out of bounds at Y=${this.gameObject.y.toFixed(1)})`); // <<< ADD LOG HERE
            this.objectManager.destroyObject(this.gameObject.id);
        }
    }

    destroy(): void {}
}
