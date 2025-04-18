import { BaseComponent } from './BaseComponent.js';
import { SpriteComponent } from './SpriteComponent.js';
import { IGameObject } from '../../types/core.js';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CollisionComponentProps {
    /** Identifier for the collision group this object belongs to (e.g., 'player', 'enemy', 'bullet') */
    group: string;
    /** Array of group names this object should collide with */
    collidesWith: string[];
    /** Optional flag for pixel-perfect collision (requires more setup) */
    usePixelCollision?: boolean;
}

export class CollisionComponent extends BaseComponent {
    public group: string;
    public collidesWith: string[];
    public usePixelCollision: boolean;

    constructor(config: CollisionComponentProps) {
        super();
        this.group = config.group;
        this.collidesWith = config.collidesWith;
        this.usePixelCollision = config.usePixelCollision ?? false;
    }

    init(): void {
        // console.log(`CollisionComponent initialized for ${this.gameObject?.name} (Group: ${this.group})`);
    }

    update(deltaTime: number): void {
        // Collision detection logic is handled by the CollisionSystem
    }

    destroy(): void {
        // console.log(`CollisionComponent destroyed for ${this.gameObject?.name}`);
    }

    /**
     * Calculates the world-space Axis-Aligned Bounding Box (AABB) for this object.
     * Assumes the object's position (x, y) is its anchor point.
     */
    getBoundingBox(): BoundingBox | null {
        if (!this.gameObject) return null;

        const spriteComp = this.gameObject.getComponent(SpriteComponent);
        if (!spriteComp || spriteComp.width <= 0 || spriteComp.height <= 0) {
            // Cannot determine bounds without a valid sprite component with dimensions
            return null;
        }

        // Calculate top-left corner based on anchor and dimensions
        const topLeftX = this.gameObject.x - spriteComp.offsetX;
        const topLeftY = this.gameObject.y - spriteComp.offsetY;

        return {
            x: topLeftX,
            y: topLeftY,
            width: spriteComp.width,
            height: spriteComp.height,
        };
    }
}
