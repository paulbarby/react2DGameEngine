import { BaseComponent } from './BaseComponent.js'; // Added .js
export class SpriteComponent extends BaseComponent {
    constructor(config) {
        var _a, _b, _c, _d;
        super();
        this.width = 0;
        this.height = 0;
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
        this.offsetX = (_c = config.offsetX) !== null && _c !== void 0 ? _c : 0;
        this.offsetY = (_d = config.offsetY) !== null && _d !== void 0 ? _d : 0;
    }
    init() {
        var _a;
        // Initial setup - parse spriteRef, potentially load definition if needed
        // This logic might be better placed in an AssetSystem or handled by ObjectManager
        // For now, just log. Actual parsing/lookup will happen in Renderer or an Animation system.
        console.log(`SpriteComponent for ${(_a = this.gameObject) === null || _a === void 0 ? void 0 : _a.name} initialized with ref: ${this.spriteRef}`);
        this.parseSpriteRef();
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
        }
        else if (definition) {
            console.warn(`Sprite name ${this.currentSpriteName} not found in definition for sheet ${this.currentSheetKey}`);
        }
        // If no definition provided, Renderer will need to look it up
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
