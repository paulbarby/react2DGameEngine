import { ObjectManager } from '../objects/ObjectManager.js';
import { IGameObject } from '../../types/core.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { SpriteComponent } from '../components/SpriteComponent.js'; // Needed for AABB check
import { AssetLoader } from '../assets/AssetLoader.js'; // Import AssetLoader
import { EventBus } from '../events/EventBus.js'; // Import EventBus
import { createCollisionEvent } from '../events/EventTypes.js'; // Import event creator

export class CollisionSystem {
    private objectManager: ObjectManager;
    private assetLoader: AssetLoader; // Add AssetLoader
    private eventBus: EventBus; // Add EventBus
    // Optional: Cache for offscreen canvases/contexts to improve performance
    private offscreenCanvasA: HTMLCanvasElement | null = null;
    private offscreenContextA: CanvasRenderingContext2D | null = null;
    private offscreenCanvasB: HTMLCanvasElement | null = null;
    private offscreenContextB: CanvasRenderingContext2D | null = null;

    constructor(objectManager: ObjectManager, assetLoader: AssetLoader, eventBus: EventBus) { // Add eventBus parameter
        this.objectManager = objectManager;
        this.assetLoader = assetLoader; // Store assetLoader
        this.eventBus = eventBus; // Store eventBus
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
                        // --- Publish Collision Event ---
                        // Check if objects still exist right before publishing
                        if (this.objectManager.getObjectById(objA.id) && this.objectManager.getObjectById(objB.id)) {
                            this.eventBus.publish(createCollisionEvent(objA, objB));
                            // Note: The event listener is now responsible for handling the collision logic
                            // (e.g., destroying objects, playing sounds).
                        }
                        // --- End Publish Collision Event ---
                    }
                }
            }
        }
    }

    // AABB collision check - Modify to call pixel check on overlap
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

        // If AABB overlaps, perform pixel check
        if (!noOverlap) {
            // Log AABB overlap before pixel check
            if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
                console.log(`  -> AABB Overlap detected. Proceeding to pixel check...`);
            }
            // Call pixel collision check
            return this.checkPixelCollision(objA, objB, {leftA, rightA, topA, bottomA}, {leftB, rightB, topB, bottomB});
        }

        // Log no overlap result for bullet/enemy checks
        if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
            console.log(`  -> No AABB Overlap.`);
        }

        return false; // No AABB overlap
    }

    // --- NEW: Pixel-Perfect Collision Check ---
    private checkPixelCollision(
        objA: IGameObject,
        objB: IGameObject,
        boundsA: { leftA: number, rightA: number, topA: number, bottomA: number },
        boundsB: { leftB: number, rightB: number, topB: number, bottomB: number }
    ): boolean {
        const spriteA = objA.getComponent(SpriteComponent);
        const spriteB = objB.getComponent(SpriteComponent);
        // Get components for logging
        const compA = objA.getComponent(CollisionComponent);
        const compB = objB.getComponent(CollisionComponent);

        // 1. Check if components and necessary sprite data exist
        if (!spriteA || !spriteB || !spriteA.imageKey || !spriteB.imageKey ||
            spriteA.sourceWidth <= 0 || spriteA.sourceHeight <= 0 ||
            spriteB.sourceWidth <= 0 || spriteB.sourceHeight <= 0) {
            console.warn(`Pixel check skipped: Missing sprite component, imageKey, or valid source dimensions for ${objA.name} or ${objB.name}. Falling back to AABB result (true).`);
            return true; // Fallback: Assume collision if AABB overlapped but pixel data is invalid
        }

        const imageA = this.assetLoader.getAsset<HTMLImageElement>(spriteA.imageKey);
        const imageB = this.assetLoader.getAsset<HTMLImageElement>(spriteB.imageKey);

        if (!imageA || !imageB) {
            console.warn(`Pixel check skipped: Image asset not found for ${objA.name} (${spriteA.imageKey}) or ${objB.name} (${spriteB.imageKey}). Falling back to AABB result (true).`);
            return true; // Fallback
        }

        // 2. Calculate Intersection Rectangle (World Space)
        const intersectLeft = Math.max(boundsA.leftA, boundsB.leftB);
        const intersectRight = Math.min(boundsA.rightA, boundsB.rightB);
        const intersectTop = Math.max(boundsA.topA, boundsB.topB);
        const intersectBottom = Math.min(boundsA.bottomA, boundsB.bottomB);

        // If intersection area is zero or negative, no collision (shouldn't happen if AABB passed, but check anyway)
        if (intersectLeft >= intersectRight || intersectTop >= intersectBottom) {
            return false;
        }

        // 3. Prepare Offscreen Canvases and Contexts
        // Reuse or create canvases matching the source sprite dimensions
        this.offscreenCanvasA = this.prepareOffscreenCanvas(this.offscreenCanvasA, spriteA.sourceWidth, spriteA.sourceHeight);
        this.offscreenContextA = this.offscreenCanvasA.getContext('2d', { willReadFrequently: true }); // Hint for performance

        this.offscreenCanvasB = this.prepareOffscreenCanvas(this.offscreenCanvasB, spriteB.sourceWidth, spriteB.sourceHeight);
        this.offscreenContextB = this.offscreenCanvasB.getContext('2d', { willReadFrequently: true });

        if (!this.offscreenContextA || !this.offscreenContextB) {
             console.error("Failed to get offscreen 2D context for pixel collision.");
             return true; // Fallback
        }

        // 4. Draw Sprite Frames to Offscreen Canvases
        this.offscreenContextA.clearRect(0, 0, spriteA.sourceWidth, spriteA.sourceHeight);
        this.offscreenContextA.drawImage(imageA,
            spriteA.sourceX, spriteA.sourceY, spriteA.sourceWidth, spriteA.sourceHeight,
            0, 0, spriteA.sourceWidth, spriteA.sourceHeight);

        this.offscreenContextB.clearRect(0, 0, spriteB.sourceWidth, spriteB.sourceHeight);
        this.offscreenContextB.drawImage(imageB,
            spriteB.sourceX, spriteB.sourceY, spriteB.sourceWidth, spriteB.sourceHeight,
            0, 0, spriteB.sourceWidth, spriteB.sourceHeight);

        // 5. Get Image Data
        let imageDataA: ImageData | null = null;
        let imageDataB: ImageData | null = null;
        try {
            imageDataA = this.offscreenContextA.getImageData(0, 0, spriteA.sourceWidth, spriteA.sourceHeight);
            imageDataB = this.offscreenContextB.getImageData(0, 0, spriteB.sourceWidth, spriteB.sourceHeight);
        } catch (e) {
            console.error("Security error getting ImageData (tainted canvas?):", e);
            return true; // Fallback if reading data fails
        }

        if (!imageDataA || !imageDataB) return true; // Fallback

        const dataA = imageDataA.data;
        const dataB = imageDataB.data;
        const alphaThreshold = 10; // Consider pixels with alpha > 10 as opaque

        // 6. Iterate Through Intersection Area
        // Loop through world coordinates in the intersection rectangle
        for (let wx = Math.floor(intersectLeft); wx < Math.ceil(intersectRight); wx++) {
            for (let wy = Math.floor(intersectTop); wy < Math.ceil(intersectBottom); wy++) {
                // Convert world (wx, wy) to local pixel coordinates for each sprite
                // Assumes object x/y is center anchor
                const pxA = Math.floor(wx - boundsA.leftA);
                const pyA = Math.floor(wy - boundsA.topA);

                const pxB = Math.floor(wx - boundsB.leftB);
                const pyB = Math.floor(wy - boundsB.topB);

                // Check if local coordinates are within the sprite's drawn area (0 to width/height-1)
                if (pxA >= 0 && pxA < spriteA.width && pyA >= 0 && pyA < spriteA.height &&
                    pxB >= 0 && pxB < spriteB.width && pyB >= 0 && pyB < spriteB.height)
                {
                    // Calculate index in the ImageData array (4 bytes per pixel: R, G, B, A)
                    // Note: We use the sourceWidth for stride, as that's the ImageData dimension
                    const indexA = (pyA * spriteA.sourceWidth + pxA) * 4;
                    const indexB = (pyB * spriteB.sourceWidth + pxB) * 4;

                    // Get alpha values (index + 3)
                    const alphaA = dataA[indexA + 3];
                    const alphaB = dataB[indexB + 3];

                    // Check for collision (both pixels are sufficiently opaque)
                    if (alphaA > alphaThreshold && alphaB > alphaThreshold) {
                         // Log pixel collision detection for bullet/enemy
                         if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
                             console.log(`  -> Pixel Collision DETECTED at world (${wx}, ${wy}) / localA (${pxA}, ${pyA}) / localB (${pxB}, ${pyB})`);
                         }
                        return true; // Collision detected!
                    }
                }
            }
        }

        // If loop completes without finding overlapping opaque pixels
        if ((compA?.group === 'bullet' && compB?.group === 'enemy') || (compA?.group === 'enemy' && compB?.group === 'bullet')) {
            console.log(`  -> No pixel collision found within AABB intersection.`);
        }
        return false;
    }

    // Helper to create or resize offscreen canvas
    private prepareOffscreenCanvas(canvas: HTMLCanvasElement | null, width: number, height: number): HTMLCanvasElement {
        if (!canvas) {
            canvas = document.createElement('canvas');
        }
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        return canvas;
    }
}
