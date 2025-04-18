import { BaseComponent } from './BaseComponent.js';
import { SpriteComponent } from './SpriteComponent.js';
import { AssetLoader } from '../assets/AssetLoader.js'; // Needed to get definitions
import { AnimationDefinition, SpriteDefinition } from '../../types/project.js';

interface AnimationComponentProps {
    assetLoader: AssetLoader;
    defaultAnimation?: string; // Name of the animation to play initially
}

export class AnimationComponent extends BaseComponent {
    private assetLoader: AssetLoader;
    private spriteComponent: SpriteComponent | null = null;
    private currentAnimation: AnimationDefinition | null = null;
    private currentAnimationName: string | null = null;
    private currentFrameIndex: number = 0;
    private timeAccumulator: number = 0;
    private frameDuration: number = 0;
    private isPlaying: boolean = false;

    constructor(config: AnimationComponentProps) {
        super();
        this.assetLoader = config.assetLoader;
        this.currentAnimationName = config.defaultAnimation ?? null;
    }

    init(): void {
        this.spriteComponent = this.gameObject?.getComponent(SpriteComponent) ?? null;
        if (!this.spriteComponent) {
            console.error(`AnimationComponent on ${this.gameObject?.name} requires a SpriteComponent.`);
            return;
        }
        if (this.currentAnimationName) {
            this.play(this.currentAnimationName);
        }
    }

    play(animationName: string): void {
        if (!this.spriteComponent || !this.spriteComponent.currentSheetKey) {
            console.warn(`Cannot play animation "${animationName}" on ${this.gameObject?.name}: SpriteComponent or sheet key missing.`);
            return;
        }

        const definition = this.assetLoader.getSpriteSheetDefinition(this.spriteComponent.currentSheetKey);
        if (!definition || !definition.animations || !definition.animations[animationName]) {
            console.warn(`Animation "${animationName}" not found in sheet "${this.spriteComponent.currentSheetKey}" for ${this.gameObject?.name}.`);
            this.stop();
            return;
        }

        const newAnimation = definition.animations[animationName];

        // Avoid restarting if already playing the same animation
        if (this.isPlaying && this.currentAnimation === newAnimation) {
            return;
        }

        this.currentAnimation = newAnimation;
        this.currentAnimationName = animationName;
        this.currentFrameIndex = 0;
        this.timeAccumulator = 0;
        this.frameDuration = this.currentAnimation.duration / this.currentAnimation.frames.length;
        this.isPlaying = true;

        console.log(`Playing animation "${animationName}" on ${this.gameObject?.name}`);
        this.updateSpriteFrame(); // Set initial frame
    }

    stop(): void {
        this.isPlaying = false;
        this.currentAnimation = null;
        this.currentAnimationName = null;
        this.currentFrameIndex = 0;
        this.timeAccumulator = 0;
        console.log(`Stopped animation on ${this.gameObject?.name}`);
    }

    update(deltaTime: number): void {
        if (!this.isPlaying || !this.currentAnimation || !this.spriteComponent || this.frameDuration <= 0) {
            return;
        }

        this.timeAccumulator += deltaTime;

        // Check if it's time to advance frame(s)
        while (this.timeAccumulator >= this.frameDuration) {
            this.timeAccumulator -= this.frameDuration;
            this.currentFrameIndex++;

            // Check bounds and looping
            if (this.currentFrameIndex >= this.currentAnimation.frames.length) {
                if (this.currentAnimation.loop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.currentFrameIndex = this.currentAnimation.frames.length - 1; // Stay on last frame
                    this.stop(); // Stop playing if not looping
                    break; // Exit loop after stopping
                }
            }
        }

        // Update the sprite component's source rect based on the current frame
        // Only update if the animation is still playing (might have stopped in the loop)
        if (this.isPlaying) {
            this.updateSpriteFrame();
        }
    }

    private updateSpriteFrame(): void {
        if (!this.currentAnimation || !this.spriteComponent || !this.spriteComponent.currentSheetKey) return;

        const frameName = this.currentAnimation.frames[this.currentFrameIndex];
        const definition = this.assetLoader.getSpriteSheetDefinition(this.spriteComponent.currentSheetKey);

        if (!definition || !definition.sprites[frameName]) {
            console.error(`Sprite frame "${frameName}" not found in definition "${this.spriteComponent.currentSheetKey}" during animation.`);
            this.stop();
            return;
        }

        const spriteData = definition.sprites[frameName];

        // Update SpriteComponent's source rectangle details
        // This avoids the Renderer having to look up the definition again
        this.spriteComponent.sourceX = spriteData.x;
        this.spriteComponent.sourceY = spriteData.y;
        this.spriteComponent.sourceWidth = definition.frameWidth;
        this.spriteComponent.sourceHeight = definition.frameHeight;
        // Ensure imageKey is set if it wasn't already
        if (!this.spriteComponent.imageKey) {
            this.spriteComponent.imageKey = definition.image;
        }
        // Update dimensions and offset if needed (e.g., if width/height were 0)
        if (this.spriteComponent.width === 0) this.spriteComponent.width = definition.frameWidth;
        if (this.spriteComponent.height === 0) this.spriteComponent.height = definition.frameHeight;
        this.spriteComponent.updateOffsetFromAnchor(); // Recalculate offset if dimensions changed

        // Update the spriteRef just for consistency, though Renderer uses sourceX/Y etc. now
        this.spriteComponent.spriteRef = `${this.spriteComponent.currentSheetKey}/${frameName}`;
        this.spriteComponent.currentSpriteName = frameName;

        // console.log(`Anim ${this.gameObject?.name}: Frame ${this.currentFrameIndex} (${frameName})`);
    }


    destroy(): void {
        this.stop();
        this.spriteComponent = null; // Release reference
    }
}
