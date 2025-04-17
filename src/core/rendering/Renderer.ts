import { IGameObject } from '../../types/core.js'; // Added .js
import { Scene, Layer, SpriteDefinition } from '../../types/project.js'; // Added .js
import { ObjectManager } from '../objects/ObjectManager.js'; // Added .js
import { AssetLoader } from '../assets/AssetLoader.js'; // Added .js
import { SpriteComponent } from '../components/SpriteComponent.js'; // Added .js

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    public viewportWidth: number;
    public viewportHeight: number;
    private stars: { x: number, y: number, speed: number, size: number }[] = [];
    private starScrollY: number = 0; // Tracks overall scroll offset

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }
        this.ctx = context;
        this.canvas = canvas;
        this.viewportWidth = canvas.width;
        this.viewportHeight = canvas.height;
        this.initStars(200); // Initialize stars
    }

    private initStars(count: number): void {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.viewportWidth,
                y: Math.random() * this.viewportHeight,
                speed: 0.5 + Math.random() * 1.0, // Different speeds for parallax
                size: 0.5 + Math.random() * 1.5   // Different sizes
            });
        }
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.initStars(this.stars.length); // Reinitialize stars on resize
        // May need to reset context properties if they depend on size
    }

    private drawStarfield(deltaTime: number): void {
        const baseScrollSpeed = 50; // Pixels per second for the fastest stars
        this.starScrollY += baseScrollSpeed * deltaTime; // Update scroll offset

        this.ctx.save();
        this.ctx.fillStyle = 'white';
        for (const star of this.stars) {
            // Calculate current Y position with scroll offset and speed multiplier
            const currentY = (star.y + this.starScrollY * star.speed) % this.viewportHeight;
            this.ctx.beginPath();
            this.ctx.arc(star.x, currentY, star.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    renderScene(scene: Scene, objectManager: ObjectManager, assetLoader: AssetLoader, deltaTime: number): void { // Added deltaTime
        // Clear canvas (optional: could draw a solid background color instead)
        this.ctx.fillStyle = '#00001a'; // Dark blue background
        this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // Draw scrolling starfield first (behind everything)
        this.drawStarfield(deltaTime);

        // Sort layers by depth (ascending)
        const sortedLayers = [...scene.layers].sort((a, b) => a.depth - b.depth);

        // Loop through sorted layers
        for (const layer of sortedLayers) {
            if (!layer.visible) {
                continue;
            }

            // Apply layer transforms (placeholder - e.g., parallax scrolling)
            // this.ctx.save();
            // this.ctx.translate(layer.scrollOffsetX || 0, layer.scrollOffsetY || 0);

            const objects = objectManager.getObjectsByLayer(layer.id);
            // console.log(`Layer ${layer.name}: Processing ${objects.length} objects`); // Log object count per layer

            // Loop through objects in the layer
            for (const object of objects) {
                // Basic AABB viewport culling (simplistic)
                // Assumes object dimensions are available (e.g., via SpriteComponent)
                const spriteComp = object.getComponent(SpriteComponent);
                const objWidth = spriteComp?.width || 1; // Default size if no sprite
                const objHeight = spriteComp?.height || 1;
                const objX = object.x - (spriteComp?.offsetX || 0); // Adjust for offset
                const objY = object.y - (spriteComp?.offsetY || 0);

                if (objX + objWidth < 0 || objX > this.viewportWidth || objY + objHeight < 0 || objY > this.viewportHeight) {
                   // continue; // Skip rendering if outside viewport
                }

                // Draw the object
                this.drawObject(object, assetLoader);
            }

            // Restore layer transforms
            // this.ctx.restore();
        }
    }

    private drawObject(object: IGameObject, assetLoader: AssetLoader): void {
        this.ctx.save();

        // Apply object transforms
        this.ctx.translate(object.x, object.y);
        this.ctx.rotate(object.rotation);
        this.ctx.scale(object.scaleX, object.scaleY);

        // --- Rendering Logic ---
        const spriteComp = object.getComponent(SpriteComponent);
        if (spriteComp) {
            let image: HTMLImageElement | undefined;
            let sx = spriteComp.sourceX, sy = spriteComp.sourceY, sw = spriteComp.sourceWidth, sh = spriteComp.sourceHeight; // Source rect from component
            let dx = -spriteComp.offsetX, dy = -spriteComp.offsetY; // Destination pos (relative to object x/y)
            let dw = spriteComp.width, dh = spriteComp.height; // Destination size

            // Flag to check if we need to update component's source rect info
            let updateComponentSourceRect = false;

            // Case 1: Sprite sheet reference ("sheetKey/spriteName")
            if (spriteComp.currentSheetKey && spriteComp.currentSpriteName) {
                // Only lookup definition if component source rect is not set yet
                if (sw === 0 || sh === 0 || !spriteComp.imageKey) {
                    const definition = assetLoader.getSpriteSheetDefinition(spriteComp.currentSheetKey);
                    if (definition) {
                        const spriteData = definition.sprites[spriteComp.currentSpriteName];
                        if (spriteData) {
                            sx = spriteData.x;
                            sy = spriteData.y;
                            sw = definition.frameWidth;
                            sh = definition.frameHeight;
                            spriteComp.imageKey = definition.image; // Store image key in component
                            updateComponentSourceRect = true; // Mark for update
                        } else {
                            console.warn(`Sprite ${spriteComp.currentSpriteName} not found in sheet ${spriteComp.currentSheetKey} for ${object.name}`);
                        }
                    } else {
                         console.warn(`Sprite sheet definition ${spriteComp.currentSheetKey} not loaded for ${object.name}`);
                    }
                }
                // Get image using the key stored in the component
                if (spriteComp.imageKey) {
                    image = assetLoader.getAsset<HTMLImageElement>(spriteComp.imageKey);
                }
            }
            // Case 2: Direct image reference ("imageKey")
            else if (spriteComp.imageKey) {
                 image = assetLoader.getAsset<HTMLImageElement>(spriteComp.imageKey);
                 if (image && (sw === 0 || sh === 0)) { // If component source rect not set
                     sx = 0;
                     sy = 0;
                     sw = image.naturalWidth;
                     sh = image.naturalHeight;
                     updateComponentSourceRect = true; // Mark for update
                 }
            }

            // Update component's source rect info if needed
            if (updateComponentSourceRect && sw > 0 && sh > 0) {
                spriteComp.sourceX = sx;
                spriteComp.sourceY = sy;
                spriteComp.sourceWidth = sw;
                spriteComp.sourceHeight = sh;
                // Update component's display size if it wasn't explicitly set
                if (dw === 0) spriteComp.width = sw;
                if (dh === 0) spriteComp.height = sh;
                // Re-read potentially updated dimensions for this draw call
                dw = spriteComp.width;
                dh = spriteComp.height;
            }

            // Draw if we have an image and source dimensions
            if (image && sw > 0 && sh > 0) {
                 // --- Add Logging ---
                 // console.log(`Drawing ${object.name}: img=${image.src.substring(image.src.lastIndexOf('/')+1)}, sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}, dx=${dx}, dy=${dy}, dw=${dw}, dh=${dh}`);
                 this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            } else if (!spriteComp.imageKey && !spriteComp.currentSheetKey) {
                // Optionally draw a placeholder if spriteRef is invalid/not set
                 this.ctx.fillStyle = 'magenta';
                 this.ctx.fillRect(dx, dy, dw || 10, dh || 10); // Draw placeholder
                 console.warn(`SpriteComponent on ${object.name} has invalid spriteRef: ${spriteComp.spriteRef}`);
            } else if (!image) {
                 console.warn(`Image not found for ${object.name} (key: ${spriteComp.imageKey || 'unknown'})`);
                 // Draw placeholder if image missing
                 this.ctx.fillStyle = 'red';
                 this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
            } else {
                 console.warn(`Source dimensions invalid for ${object.name} (sw=${sw}, sh=${sh})`);
                 // Draw placeholder if source rect invalid
                 this.ctx.fillStyle = 'orange';
                 this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
            }
        } else {
            // Handle other renderable components or draw a default placeholder
            this.ctx.fillStyle = 'grey';
            this.ctx.fillRect(-5, -5, 10, 10); // Default placeholder
        }
        // --- End Rendering Logic ---

        this.ctx.restore();
    }
}
