import { BaseComponent } from './BaseComponent.js';
import { AnimationComponent } from './AnimationComponent.js';
import { ObjectManager } from '../objects/ObjectManager.js'; // Import ObjectManager
import { info, warn, error, debug } from '../utils/logger.js'; // Import logger functions

interface ExplosionCompletionProps {
    objectManager: ObjectManager; // Expect objectManager to be injected
}

/**
 * Destroys the GameObject after its AnimationComponent finishes a non-looping animation.
 */
export class ExplosionCompletionComponent extends BaseComponent {
    private animationComponent: AnimationComponent | undefined;
    private objectManager: ObjectManager; // Store the injected ObjectManager
    private hasFinished: boolean = false; // Flag to prevent multiple destruction calls

    constructor(config: ExplosionCompletionProps) { // Accept config object
        super();
        // Store the injected objectManager
        if (!config.objectManager) {
            error("ExplosionCompletionComponent requires 'objectManager' in config properties."); // Use logger
            throw new Error("ExplosionCompletionComponent requires 'objectManager' in config properties.");
        }
        this.objectManager = config.objectManager;
    }

    init(): void {
        this.animationComponent = this.gameObject?.getComponent(AnimationComponent);
        if (!this.animationComponent) {
            warn(`ExplosionCompletionComponent on ${this.gameObject?.name}: Missing AnimationComponent.`); // Use logger
        }
        if (!this.objectManager) {
             error(`ExplosionCompletionComponent on ${this.gameObject?.name}: ObjectManager not assigned!`); // Use logger
        }
    }

    update(deltaTime: number): void {
        if (!this.gameObject || !this.animationComponent || this.hasFinished || !this.objectManager) {
            return;
        }

        // Check if the animation has finished playing using the public getter
        if (!this.animationComponent.isPlaying) { // Use the isPlaying getter
            this.hasFinished = true; // Set flag immediately
            info(`Explosion ${this.gameObject.name} animation finished. Destroying object.`); // Use logger

            // Use a minimal setTimeout to ensure destruction happens after the current update cycle
            // This prevents potential issues if other systems rely on the object existing during this frame.
            setTimeout(() => {
                // Double-check if the object still exists before destroying
                if (this.gameObject && this.objectManager.getObjectById(this.gameObject.id)) {
                    this.objectManager.destroyObject(this.gameObject.id);
                } else {
                    warn(`ExplosionCompletionComponent: Object ${this.gameObject?.id} already destroyed before timeout callback.`); // Use logger
                }
            }, 0);
        }
    }

    destroy(): void {
        // Cleanup if needed
    }
}
