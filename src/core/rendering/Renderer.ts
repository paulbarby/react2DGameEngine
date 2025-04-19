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
        // --- Add Player Specific Log ---
        if (object.type === 'player') {
            const spriteComp = object.getComponent(SpriteComponent);
            console.log(`Renderer.drawObject: PLAYER DETECTED - ID: ${object.id}, Pos: (${object.x.toFixed(1)}, ${object.y.toFixed(1)}), Rot: ${object.rotation.toFixed(2)}, Scale: (${object.scaleX}, ${object.scaleY}), Sprite: ${spriteComp ? `Ref='${spriteComp.spriteRef}', W=${spriteComp.width}, H=${spriteComp.height}, Anchor=(${spriteComp.anchor.x},${spriteComp.anchor.y}), Offset=(${spriteComp.offsetX.toFixed(1)},${spriteComp.offsetY.toFixed(1)})` : 'No SpriteComp'}`);
        }
        // --- End Player Specific Log ---

        this.ctx.save();

        // Apply object transforms (position is now the anchor point)
        this.ctx.translate(object.x, object.y);
        this.ctx.rotate(object.rotation);
        this.ctx.scale(object.scaleX, object.scaleY);

        // --- Rendering Logic ---
        const spriteComp = object.getComponent(SpriteComponent);
        if (spriteComp) {
            // <<< ADD LOGGING FOR BULLETS >>>
            if (object.type === 'bullet') {
                console.log(`Drawing bullet ${object.id}: spriteRef='${spriteComp.spriteRef}', sheet='${spriteComp.currentSheetKey}', sprite='${spriteComp.currentSpriteName}', imageKey='${spriteComp.imageKey}'`);
            }
            // <<< END LOGGING FOR BULLETS >>>

            let image: HTMLImageElement | undefined;
            let sx = spriteComp.sourceX, sy = spriteComp.sourceY, sw = spriteComp.sourceWidth, sh = spriteComp.sourceHeight;
            // dx/dy are now calculated relative to the anchor point (object.x, object.y)
            // using the component's calculated offsetX/offsetY
            let dx = -spriteComp.offsetX;
            let dy = -spriteComp.offsetY;
            let dw = spriteComp.width, dh = spriteComp.height;

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

            // <<< ADD LOGGING FOR BULLETS (IMAGE/RECT) >>>
             if (object.type === 'bullet') {
                 const definition = spriteComp.currentSheetKey ? assetLoader.getSpriteSheetDefinition(spriteComp.currentSheetKey) : undefined;
                 const spriteData = definition && spriteComp.currentSpriteName ? definition.sprites[spriteComp.currentSpriteName] : undefined;
                 console.log(`  -> Bullet ${object.id}: Image found=${!!image}, Def found=${!!definition}, SpriteData found=${!!spriteData}, Rect=(${sx},${sy},${sw},${sh})`);
             }
            // <<< END LOGGING FOR BULLETS (IMAGE/RECT) >>>

            // Update component's source rect info AND OFFSET if needed
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

                // *** IMPORTANT: Update offset based on potentially new dimensions ***
                spriteComp.updateOffsetFromAnchor();
                // *** Update dx/dy based on the potentially new offset ***
                dx = -spriteComp.offsetX;
                dy = -spriteComp.offsetY;
            }

            // Draw if we have an image and source dimensions
            if (image && sw > 0 && sh > 0) {
                 // Draw image relative to the anchor point using calculated dx, dy
                 this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            } else {
                // Optionally draw a placeholder if spriteRef is invalid/not set
                 if (!spriteComp.imageKey && !spriteComp.currentSheetKey) {
                     this.ctx.fillStyle = 'magenta';
                     this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
                     console.warn(`SpriteComponent on ${object.name} has invalid spriteRef: ${spriteComp.spriteRef}`);
                 } else if (!image) {
                     this.ctx.fillStyle = 'red';
                     this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
                     console.warn(`Image not found for ${object.name} (key: ${spriteComp.imageKey || 'unknown'})`);
                 } else {
                     this.ctx.fillStyle = 'orange';
                     this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
                     console.warn(`Source dimensions invalid for ${object.name} (sw=${sw}, sh=${sh})`);
                 }
                 // <<< ADD LOGGING FOR BULLETS (PLACEHOLDER) >>>
                 if (object.type === 'bullet') {
                    console.error(`  -> Bullet ${object.id}: Drawing placeholder! Reason: ${!image ? 'No Image' : (sw <= 0 || sh <= 0 ? 'Invalid Rect' : 'Unknown')}`);
                 }
                 // <<< END LOGGING FOR BULLETS (PLACEHOLDER) >>>
            }
        } else {
            // Handle other renderable components or draw a default placeholder at object's origin
            this.ctx.fillStyle = 'grey';
            this.ctx.fillRect(-5, -5, 10, 10); // Draw centered at object x/y
        }
        // --- End Rendering Logic ---

        this.ctx.restore();
    }
}
