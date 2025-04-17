import { BaseComponent } from './BaseComponent';
import { SpriteDefinition } from '../../types/project';
// Assuming AssetLoader might be needed, or passed via GameObject or context
// import { AssetLoader } from '../assets/AssetLoader';

interface SpriteComponentProps {
    spriteRef: string; // Can be sheet key + sprite name, e.g., "playerSheet/idle_0"
    // Initial width/height might come from definition, or be overridden
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
}

export class SpriteComponent extends BaseComponent {
    public spriteRef: string;
    public width: number = 0;
    public height: number = 0;
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
        this.offsetX = config.offsetX ?? 0;
        this.offsetY = config.offsetY ?? 0;
    }

    init(): void {
        // Initial setup - parse spriteRef, potentially load definition if needed
        // This logic might be better placed in an AssetSystem or handled by ObjectManager
        // For now, just log. Actual parsing/lookup will happen in Renderer or an Animation system.
        console.log(`SpriteComponent for ${this.gameObject?.name} initialized with ref: ${this.spriteRef}`);
        this.parseSpriteRef();
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
        } else if (definition) {
             console.warn(`Sprite name ${this.currentSpriteName} not found in definition for sheet ${this.currentSheetKey}`);
        }
        // If no definition provided, Renderer will need to look it up
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
