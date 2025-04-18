import { ObjectManager } from '../objects/ObjectManager.js';
import { IGameObject } from '../../types/core.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { SpriteComponent } from '../components/SpriteComponent.js'; // Needed for AABB check

export class CollisionSystem {
    private objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
    }

    update(): void {
        const objects = Array.from(this.objectManager.getAllObjects());
        const collisionComponents: CollisionComponent[] = [];

        // 1. Collect valid collision components that have a group defined
        for (const obj of objects) {
            // Ensure object still exists before getting component
            if (!this.objectManager.getObjectById(obj.id)) continue;

            const comp = obj.getComponent(CollisionComponent);
            // Only add components that exist AND have a group property
            if (comp?.group) {
                collisionComponents.push(comp);
            } else if (comp) {
                // Log if a collision component exists but lacks a group
                console.warn(`CollisionComponent on object ${obj.name} (${obj.id}) is missing a 'group'. Skipping collision checks for this component.`);
            }
        }

        // 2. Check for collisions
        for (let i = 0; i < collisionComponents.length; i++) {
            const compA = collisionComponents[i];
            // Ensure compA and its gameObject are still valid at the start of the outer loop iteration
            if (!compA?.gameObject || !this.objectManager.getObjectById(compA.gameObject.id)) {
                continue;
            }

            for (let j = i + 1; j < collisionComponents.length; j++) {
                const compB = collisionComponents[j];
                // Ensure compB and its gameObject are still valid at the start of the inner loop iteration
                 if (!compB?.gameObject || !this.objectManager.getObjectById(compB.gameObject.id)) {
                    continue;
                }

                // Groups compA.group and compB.group are guaranteed to exist here due to the filtering in step 1

                // Check if these groups should collide based on their config
                const shouldACollideWithB = compA.collidesWith.includes(compB.group);
                const shouldBCollideWithA = compB.collidesWith.includes(compA.group);

                if (shouldACollideWithB || shouldBCollideWithA) {
                    // Perform AABB check - Ensure objects still exist right before check
                    const objA = compA.gameObject;
                    const objB = compB.gameObject;
                    if (!objA || !objB || !this.objectManager.getObjectById(objA.id) || !this.objectManager.getObjectById(objB.id)) {
                        continue; // Skip if either object was destroyed just now
                    }

                    if (this.checkAABB(objA, objB)) {
                        // Trigger collision callbacks, checking validity before each call

                        // Call A's callback if it exists and B is still valid
                        if (compA.onCollision && this.objectManager.getObjectById(objB.id)) {
                             compA.onCollision(objB);
                        }

                        // Call B's callback if it exists and A is still valid (might have been destroyed by A's callback)
                        if (compB.onCollision && this.objectManager.getObjectById(objA.id)) {
                             compB.onCollision(objA);
                        }
                        // Note: The checks at the start of the loops handle cases where
                        // objects are destroyed and affect subsequent iterations.
                    }
                }
            }
        }
    }

    // AABB collision check
    private checkAABB(objA: IGameObject, objB: IGameObject): boolean {
        // Get dimensions - Prefer SpriteComponent, fallback to small default
        const spriteA = objA.getComponent(SpriteComponent);
        const spriteB = objB.getComponent(SpriteComponent);

        // Use component dimensions if available and valid, otherwise default
        // Check spriteA/B existence before accessing properties in the ternary true branch
        const widthA = spriteA && spriteA.width > 0 ? spriteA.width : 10;
        const heightA = spriteA && spriteA.height > 0 ? spriteA.height : 10;
        const widthB = spriteB && spriteB.width > 0 ? spriteB.width : 10;
        const heightB = spriteB && spriteB.height > 0 ? spriteB.height : 10;

        // Calculate AABB bounds assuming objA.x/y is the center (anchor 0.5, 0.5)
        const leftA = objA.x - widthA / 2;
        const rightA = objA.x + widthA / 2;
        const topA = objA.y - heightA / 2;
        const bottomA = objA.y + heightA / 2;

        const leftB = objB.x - widthB / 2;
        const rightB = objB.x + widthB / 2;
        const topB = objB.y - heightB / 2;
        const bottomB = objB.y + heightB / 2;

        // Log bounds specifically for bullet/enemy checks
        const compA = objA.getComponent(CollisionComponent);
        const compB = objB.getComponent(CollisionComponent);
        if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
             console.log(`AABB Check: ${objA.name} vs ${objB.name}`);
             console.log(`  ${objA.name} (w:${widthA.toFixed(1)}, h:${heightA.toFixed(1)}) Bounds: L=${leftA.toFixed(1)}, R=${rightA.toFixed(1)}, T=${topA.toFixed(1)}, B=${bottomA.toFixed(1)}`);
             console.log(`  ${objB.name} (w:${widthB.toFixed(1)}, h:${heightB.toFixed(1)}) Bounds: L=${leftB.toFixed(1)}, R=${rightB.toFixed(1)}, T=${topB.toFixed(1)}, B=${bottomB.toFixed(1)}`);
        }

        // Check for non-overlap
        const noOverlap =
            rightA <= leftB || // Use <= and >= for edge cases
            leftA >= rightB ||
            bottomA <= topB ||
            topA >= bottomB;

        // Log result for bullet/enemy checks
        if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
            console.log(`  -> Overlap detected: ${!noOverlap}`);
        }

        return !noOverlap; // Return true if they overlap
    }
}
