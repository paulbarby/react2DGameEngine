import { BaseComponent } from './BaseComponent.js'; // Added .js
import { SpriteDefinition } from '../../types/project.js'; // Added .js
// Assuming AssetLoader might be needed, or passed via GameObject or context
// import { AssetLoader } from '../assets/AssetLoader';

interface SpriteComponentProps {
    spriteRef: string; // Can be sheet key + sprite name, e.g., "playerSheet/idle_0"
    // Initial width/height might come from definition, or be overridden
    width?: number;
    height?: number;
    offsetX?: number; // Keep for potential direct override, though anchor is preferred
    offsetY?: number; // Keep for potential direct override
    anchor?: { x: number, y: number }; // Normalized anchor point
}

export class SpriteComponent extends BaseComponent {
    public spriteRef: string;
    public width: number = 0;
    public height: number = 0;
    public anchor: { x: number, y: number } = { x: 0, y: 0 }; // Default anchor: top-left
    public offsetX: number = 0;
    public offsetY: number = 0;

    // Current frame details for rendering (if spriteRef points to a single sprite)
    public currentSpriteName: string | null = null;
    public currentSheetKey: string | null = null;
    public sourceX: number = 0;
    public sourceY: number = 0;
    public sourceWidth: number = 0;
    public sourceHeight: number = 0;
    public imageKey: string | null = null; // Key for the actual image asset

    constructor(config: SpriteComponentProps) {
        super();
        this.spriteRef = config.spriteRef;
        this.width = config.width ?? 0; // Default or allow override
        this.height = config.height ?? 0;
        this.anchor = config.anchor ?? { x: 0, y: 0 }; // Use provided anchor or default

        // Use direct offset override ONLY if anchor is NOT provided
        if (!config.anchor) {
            this.offsetX = config.offsetX ?? 0;
            this.offsetY = config.offsetY ?? 0;
        }
    }

    init(): void {
        // Initial setup - parse spriteRef, potentially load definition if needed
        // This logic might be better placed in an AssetSystem or handled by ObjectManager
        // For now, just log. Actual parsing/lookup will happen in Renderer or an Animation system.
        console.log(`SpriteComponent for ${this.gameObject?.name} initialized with ref: ${this.spriteRef}`);
        this.parseSpriteRef();
        // Calculate initial offset if dimensions are already known from config
        if (this.width > 0 && this.height > 0) {
            this.updateOffsetFromAnchor();
        }
    }

    // Helper to parse "sheetKey/spriteName" format
    private parseSpriteRef() {
        const parts = this.spriteRef.split('/');
        if (parts.length === 2) {
            this.currentSheetKey = parts[0];
            this.currentSpriteName = parts[1];
        } else {
            // Assume it might be just an image key? Or invalid format.
            this.imageKey = this.spriteRef; // Simplistic assumption
            console.warn(`SpriteComponent ref "${this.spriteRef}" might not be in 'sheetKey/spriteName' format.`);
        }
    }

    // Call this method when the sprite reference needs to change (e.g., animation)
    setSprite(spriteRef: string, definition?: SpriteDefinition) {
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
            if (this.width === 0) this.width = this.sourceWidth;
            if (this.height === 0) this.height = this.sourceHeight;

            // Update offset based on potentially new dimensions
            this.updateOffsetFromAnchor();
        } else if (definition) {
             console.warn(`Sprite name ${this.currentSpriteName} not found in definition for sheet ${this.currentSheetKey}`);
        }
        // If no definition provided, Renderer will need to look it up
    }

    // Calculate pixel offset based on anchor point and dimensions
    updateOffsetFromAnchor(): void {
        // Only calculate if width and height are valid
        if (this.width > 0 && this.height > 0) {
            this.offsetX = this.width * this.anchor.x;
            this.offsetY = this.height * this.anchor.y;
            // console.log(`Updated offset for ${this.gameObject?.name}: (${this.offsetX}, ${this.offsetY}) based on anchor (${this.anchor.x}, ${this.anchor.y}) and size (${this.width}, ${this.height})`);
        }
    }

    update(deltaTime: number): void {
        // Placeholder for animation logic (would likely involve time accumulation)
        // This might change the spriteRef or internal frame index
    }

    destroy(): void {
        // Cleanup component-specific resources if any
        console.log(`SpriteComponent for ${this.gameObject?.name} destroyed.`);
    }
}
