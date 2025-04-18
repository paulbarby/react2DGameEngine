import { BaseComponent } from './BaseComponent.js'; // Added .js
export class SpriteComponent extends BaseComponent {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        super();
        this.width = 0;
        this.height = 0;
        this.anchor = { x: 0, y: 0 }; // Default anchor: top-left
        this.offsetX = 0;
        this.offsetY = 0;
        // Current frame details for rendering (if spriteRef points to a single sprite)
        this.currentSpriteName = null;
        this.currentSheetKey = null;
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceWidth = 0;
        this.sourceHeight = 0;
        this.imageKey = null; // Key for the actual image asset
        this.spriteRef = config.spriteRef;
        this.width = (_a = config.width) !== null && _a !== void 0 ? _a : 0; // Default or allow override
        this.height = (_b = config.height) !== null && _b !== void 0 ? _b : 0;
        this.anchor = (_c = config.anchor) !== null && _c !== void 0 ? _c : { x: 0, y: 0 }; // Use provided anchor or default
        // Use direct offset override ONLY if anchor is NOT provided
        if (!config.anchor) {
            this.offsetX = (_d = config.offsetX) !== null && _d !== void 0 ? _d : 0;
            this.offsetY = (_e = config.offsetY) !== null && _e !== void 0 ? _e : 0;
        }
    }
    init() {
        var _a;
        // Initial setup - parse spriteRef, potentially load definition if needed
        // This logic might be better placed in an AssetSystem or handled by ObjectManager
        // For now, just log. Actual parsing/lookup will happen in Renderer or an Animation system.
        console.log(`SpriteComponent for ${(_a = this.gameObject) === null || _a === void 0 ? void 0 : _a.name} initialized with ref: ${this.spriteRef}`);
        this.parseSpriteRef();
        // Calculate initial offset if dimensions are already known from config
        if (this.width > 0 && this.height > 0) {
            this.updateOffsetFromAnchor();
        }
    }
    // Helper to parse "sheetKey/spriteName" format
    parseSpriteRef() {
        const parts = this.spriteRef.split('/');
        if (parts.length === 2) {
            this.currentSheetKey = parts[0];
            this.currentSpriteName = parts[1];
        }
        else {
            // Assume it might be just an image key? Or invalid format.
            this.imageKey = this.spriteRef; // Simplistic assumption
            console.warn(`SpriteComponent ref "${this.spriteRef}" might not be in 'sheetKey/spriteName' format.`);
        }
    }
    // Call this method when the sprite reference needs to change (e.g., animation)
    setSprite(spriteRef, definition) {
        this.spriteRef = spriteRef;
        this.parseSpriteRef();
        // If definition is provided, update dimensions immediately
        if (definition && this.currentSpriteName && definition.sprites[this.currentSpriteName]) {
            this.sourceX = definition.sprites[this.currentSpriteName].x;
            this.sourceY = definition.sprites[this.currentSpriteName].y;
            this.sourceWidth = definition.frameWidth;
            this.sourceHeight = definition.frameHeight;
            this.imageKey = definition.image;
            // Set default component size if not overridden
            if (this.width === 0)
                this.width = this.sourceWidth;
            if (this.height === 0)
                this.height = this.sourceHeight;
            // Update offset based on potentially new dimensions
            this.updateOffsetFromAnchor();
        }
        else if (definition) {
            console.warn(`Sprite name ${this.currentSpriteName} not found in definition for sheet ${this.currentSheetKey}`);
        }
        // If no definition provided, Renderer will need to look it up
    }
    // Calculate pixel offset based on anchor point and dimensions
    updateOffsetFromAnchor() {
        // Only calculate if width and height are valid
        if (this.width > 0 && this.height > 0) {
            this.offsetX = this.width * this.anchor.x;
            this.offsetY = this.height * this.anchor.y;
            // console.log(`Updated offset for ${this.gameObject?.name}: (${this.offsetX}, ${this.offsetY}) based on anchor (${this.anchor.x}, ${this.anchor.y}) and size (${this.width}, ${this.height})`);
        }
    }
    update(deltaTime) {
        // Placeholder for animation logic (would likely involve time accumulation)
        // This might change the spriteRef or internal frame index
    }
    destroy() {
        var _a;
        // Cleanup component-specific resources if any
        console.log(`SpriteComponent for ${(_a = this.gameObject) === null || _a === void 0 ? void 0 : _a.name} destroyed.`);
    }
}
