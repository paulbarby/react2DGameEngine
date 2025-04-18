import { ObjectManager } from '../objects/ObjectManager.js';
import { CollisionComponent, BoundingBox } from '../components/CollisionComponent.js';
import { IGameObject } from '../../types/core.js';

export class CollisionSystem {
    private objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
    }

    update(): void {
        const collidables: IGameObject[] = [];
        // Get all game objects that have a CollisionComponent
        for (const obj of this.objectManager.getAllObjects()) {
            if (obj.getComponent(CollisionComponent)) {
                collidables.push(obj);
            }
        }

        // Simple N^2 check (can be optimized later with spatial hashing, quadtrees, etc.)
        for (let i = 0; i < collidables.length; i++) {
            const objA = collidables[i];
            const compA = objA.getComponent(CollisionComponent)!; // We know it exists

            for (let j = i + 1; j < collidables.length; j++) {
                const objB = collidables[j];
                const compB = objB.getComponent(CollisionComponent)!; // We know it exists

                // Check if they should collide based on groups
                const shouldCollideAB = compA.collidesWith.includes(compB.group);
                const shouldCollideBA = compB.collidesWith.includes(compA.group);

                if (shouldCollideAB || shouldCollideBA) {
                    // Perform collision check
                    if (this.checkCollision(objA, objB)) {
                        // Trigger collision events on both components
                        if (shouldCollideAB) compA.triggerCollision(objB);
                        if (shouldCollideBA) compB.triggerCollision(objA);
                    }
                }
            }
        }
    }

    private checkCollision(objA: IGameObject, objB: IGameObject): boolean {
        const compA = objA.getComponent(CollisionComponent)!;
        const compB = objB.getComponent(CollisionComponent)!;

        const boxA = compA.getBoundingBox();
        const boxB = compB.getBoundingBox();

        if (!boxA || !boxB) {
            // Cannot check collision if bounding boxes are invalid
            return false;
        }

        // --- 1. AABB Check ---
        const aabbOverlap = this.checkAABBOverlap(boxA, boxB);

        if (!aabbOverlap) {
            return false; // No AABB overlap, no collision
        }

        // --- 2. Pixel Collision Check (Placeholder/Future) ---
        // Only proceed if AABB overlaps AND at least one requests pixel collision
        if (compA.usePixelCollision || compB.usePixelCollision) {
            console.warn("Pixel collision check requested but not fully implemented.");
            // To implement pixel collision:
            // 1. Get the overlapping rectangle of boxA and boxB.
            // 2. Get image data for both sprites (requires AssetLoader access or pre-cached data).
            // 3. Iterate through pixels in the overlapping rectangle.
            // 4. For each pixel, transform world coordinates back to each sprite's local image coordinates (considering rotation, scale, anchor).
            // 5. Check the alpha value of the corresponding pixels in both image data.
            // 6. If both alpha values > threshold (e.g., 128), return true.
            // If loop finishes without finding overlapping opaque pixels, return false.

            // For now, if AABB overlaps and pixel check is requested, we assume collision.
            return true;
        }

        // If only AABB check is needed, and it overlapped, return true
        return true;
    }

    private checkAABBOverlap(boxA: BoundingBox, boxB: BoundingBox): boolean {
        return (
            boxA.x < boxB.x + boxB.width &&
            boxA.x + boxA.width > boxB.x &&
            boxA.y < boxB.y + boxB.height &&
            boxA.y + boxA.height > boxB.y
        );
    }
}
