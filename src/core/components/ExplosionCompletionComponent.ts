import { BaseComponent } from './BaseComponent.js';
import { AnimationComponent } from './AnimationComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js';

interface ExplosionCompletionProps {
    objectManager: ObjectManager;
}

export class ExplosionCompletionComponent extends BaseComponent {
    private animationComponent: AnimationComponent | null = null;
    private objectManager: ObjectManager;
    private initialCheckDone: boolean = false; // Flag to ensure we only destroy once

    constructor(config: ExplosionCompletionProps) {
        super();
        this.objectManager = config.objectManager;
    }

    init(): void {
        this.animationComponent = this.gameObject?.getComponent(AnimationComponent) ?? null;
        if (!this.animationComponent) {
            console.error(`ExplosionCompletionComponent on ${this.gameObject?.name} requires an AnimationComponent.`);
            // Optionally destroy immediately if setup is wrong
            if (this.gameObject) {
                this.objectManager.destroyObject(this.gameObject.id);
            }
        }
        // Animation should start playing automatically via AnimationComponent.init()
    }

    update(deltaTime: number): void {
        if (!this.gameObject || !this.animationComponent || this.initialCheckDone) {
            return;
        }

        // Check if the animation has finished playing (isPlaying becomes false)
        // We check initialCheckDone to avoid destroying if the animation hasn't even started
        // or if it was already destroyed.
        if (!(this.animationComponent as any).isPlaying) { // Access private isPlaying for check
             console.log(`Explosion ${this.gameObject.name} animation finished. Destroying object.`);
             this.initialCheckDone = true; // Mark as checked/destroyed
             // Use setTimeout to delay destruction slightly, ensuring the last frame renders if needed
             // and preventing potential issues if destroyed during the object manager's update loop.
             setTimeout(() => {
                 // Double-check if the object still exists before destroying
                 if (this.objectManager.getObjectById(this.gameObject!.id)) {
                    this.objectManager.destroyObject(this.gameObject!.id);
                 }
             }, 0);
        }
    }

    destroy(): void {
        this.animationComponent = null; // Release reference
        // console.log(`ExplosionCompletionComponent destroyed for ${this.gameObject?.name}`);
    }
}
