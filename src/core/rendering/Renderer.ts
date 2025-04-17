import { IGameObject } from '../../types/core';
import { Scene, Layer, SpriteDefinition } from '../../types/project';
import { ObjectManager } from '../objects/ObjectManager';
import { AssetLoader } from '../assets/AssetLoader';
import { SpriteComponent } from '../components/SpriteComponent'; // Import SpriteComponent

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    public viewportWidth: number;
    public viewportHeight: number;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }
        this.ctx = context;
        this.canvas = canvas;
        this.viewportWidth = canvas.width;
        this.viewportHeight = canvas.height;
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.viewportWidth = width;
        this.viewportHeight = height;
        // May need to reset context properties if they depend on size
    }

    renderScene(scene: Scene, objectManager: ObjectManager, assetLoader: AssetLoader): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

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
            let sx = 0, sy = 0, sw = 0, sh = 0; // Source rect
            let dx = -spriteComp.offsetX, dy = -spriteComp.offsetY; // Destination pos (relative to object x/y)
            let dw = spriteComp.width, dh = spriteComp.height; // Destination size

            // Case 1: Sprite sheet reference ("sheetKey/spriteName")
            if (spriteComp.currentSheetKey && spriteComp.currentSpriteName) {
                const definition = assetLoader.getSpriteSheetDefinition(spriteComp.currentSheetKey);
                if (definition) {
                    const spriteData = definition.sprites[spriteComp.currentSpriteName];
                    if (spriteData) {
                        image = assetLoader.getAsset<HTMLImageElement>(definition.image);
                        sx = spriteData.x;
                        sy = spriteData.y;
                        sw = definition.frameWidth;
                        sh = definition.frameHeight;
                        // Use definition size if component size is 0
                        if (dw === 0) dw = sw;
                        if (dh === 0) dh = sh;
                        // Update component's knowledge if needed (first time?)
                        if (spriteComp.imageKey !== definition.image || spriteComp.sourceWidth === 0) {
                            spriteComp.setSprite(spriteComp.spriteRef, definition);
                            // Re-read potentially updated dimensions
                            dw = spriteComp.width;
                            dh = spriteComp.height;
                        }

                    } else {
                        console.warn(`Sprite ${spriteComp.currentSpriteName} not found in sheet ${spriteComp.currentSheetKey}`);
                    }
                } else {
                     console.warn(`Sprite sheet definition ${spriteComp.currentSheetKey} not loaded`);
                }
            }
            // Case 2: Direct image reference ("imageKey")
            else if (spriteComp.imageKey) {
                 image = assetLoader.getAsset<HTMLImageElement>(spriteComp.imageKey);
                 if (image) {
                     sx = 0;
                     sy = 0;
                     sw = image.naturalWidth;
                     sh = image.naturalHeight;
                     if (dw === 0) dw = sw;
                     if (dh === 0) dh = sh;
                 } else {
                     console.warn(`Image asset ${spriteComp.imageKey} not loaded`);
                 }
            }

            // Draw if we have an image and source dimensions
            if (image && sw > 0 && sh > 0) {
                 this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            } else if (!spriteComp.imageKey && !spriteComp.currentSheetKey) {
                // Optionally draw a placeholder if spriteRef is invalid/not set
                 this.ctx.fillStyle = 'magenta';
                 this.ctx.fillRect(dx, dy, dw || 10, dh || 10); // Draw placeholder
                 console.warn(`SpriteComponent on ${object.name} has invalid spriteRef: ${spriteComp.spriteRef}`);
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
