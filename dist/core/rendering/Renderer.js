import { SpriteComponent } from '../components/SpriteComponent.js'; // Added .js
export class Renderer {
    constructor(canvas) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }
        this.ctx = context;
        this.canvas = canvas;
        this.viewportWidth = canvas.width;
        this.viewportHeight = canvas.height;
    }
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.viewportWidth = width;
        this.viewportHeight = height;
        // May need to reset context properties if they depend on size
    }
    renderScene(scene, objectManager, assetLoader) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
        // console.log("Canvas cleared"); // Optional: Check if clearing happens
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
                const objWidth = (spriteComp === null || spriteComp === void 0 ? void 0 : spriteComp.width) || 1; // Default size if no sprite
                const objHeight = (spriteComp === null || spriteComp === void 0 ? void 0 : spriteComp.height) || 1;
                const objX = object.x - ((spriteComp === null || spriteComp === void 0 ? void 0 : spriteComp.offsetX) || 0); // Adjust for offset
                const objY = object.y - ((spriteComp === null || spriteComp === void 0 ? void 0 : spriteComp.offsetY) || 0);
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
    drawObject(object, assetLoader) {
        this.ctx.save();
        // Apply object transforms
        this.ctx.translate(object.x, object.y);
        this.ctx.rotate(object.rotation);
        this.ctx.scale(object.scaleX, object.scaleY);
        // --- Rendering Logic ---
        const spriteComp = object.getComponent(SpriteComponent);
        if (spriteComp) {
            let image;
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
                        }
                        else {
                            console.warn(`Sprite ${spriteComp.currentSpriteName} not found in sheet ${spriteComp.currentSheetKey} for ${object.name}`);
                        }
                    }
                    else {
                        console.warn(`Sprite sheet definition ${spriteComp.currentSheetKey} not loaded for ${object.name}`);
                    }
                }
                // Get image using the key stored in the component
                if (spriteComp.imageKey) {
                    image = assetLoader.getAsset(spriteComp.imageKey);
                }
            }
            // Case 2: Direct image reference ("imageKey")
            else if (spriteComp.imageKey) {
                image = assetLoader.getAsset(spriteComp.imageKey);
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
                if (dw === 0)
                    spriteComp.width = sw;
                if (dh === 0)
                    spriteComp.height = sh;
                // Re-read potentially updated dimensions for this draw call
                dw = spriteComp.width;
                dh = spriteComp.height;
            }
            // Draw if we have an image and source dimensions
            if (image && sw > 0 && sh > 0) {
                // --- Add Logging ---
                // console.log(`Drawing ${object.name}: img=${image.src.substring(image.src.lastIndexOf('/')+1)}, sx=${sx}, sy=${sy}, sw=${sw}, sh=${sh}, dx=${dx}, dy=${dy}, dw=${dw}, dh=${dh}`);
                this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            else if (!spriteComp.imageKey && !spriteComp.currentSheetKey) {
                // Optionally draw a placeholder if spriteRef is invalid/not set
                this.ctx.fillStyle = 'magenta';
                this.ctx.fillRect(dx, dy, dw || 10, dh || 10); // Draw placeholder
                console.warn(`SpriteComponent on ${object.name} has invalid spriteRef: ${spriteComp.spriteRef}`);
            }
            else if (!image) {
                console.warn(`Image not found for ${object.name} (key: ${spriteComp.imageKey || 'unknown'})`);
                // Draw placeholder if image missing
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
            }
            else {
                console.warn(`Source dimensions invalid for ${object.name} (sw=${sw}, sh=${sh})`);
                // Draw placeholder if source rect invalid
                this.ctx.fillStyle = 'orange';
                this.ctx.fillRect(dx, dy, dw || 10, dh || 10);
            }
        }
        else {
            // Handle other renderable components or draw a default placeholder
            this.ctx.fillStyle = 'grey';
            this.ctx.fillRect(-5, -5, 10, 10); // Default placeholder
        }
        // --- End Rendering Logic ---
        this.ctx.restore();
    }
}
