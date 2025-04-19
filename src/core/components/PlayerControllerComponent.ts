import { BaseComponent } from './BaseComponent.js';
import { InputManager } from '../input/InputManager.js';
import { SpriteComponent } from './SpriteComponent.js'; // Needed for bounds checking

interface PlayerControllerProps {
    speed: number;
    inputManager: InputManager; // This is expected to be injected by ObjectManager
    bounds: { width: number, height: number }; // Canvas dimensions
}

export class PlayerControllerComponent extends BaseComponent {
    private speed: number;
    private inputManager: InputManager; // This needs to be assigned in the constructor
    private bounds: { width: number, height: number };

    constructor(config: PlayerControllerProps) {
        super();
        this.speed = config.speed;
        // Assign the injected inputManager from the config properties
        if (!config.inputManager) {
            throw new Error("PlayerControllerComponent requires 'inputManager' in config properties.");
        }
        this.inputManager = config.inputManager;
        this.bounds = config.bounds;
    }

    init(): void {
        // Check if inputManager was successfully assigned
        if (!this.inputManager) {
             console.error(`PlayerControllerComponent for ${this.gameObject?.name}: InputManager not assigned!`);
        } else {
            console.log(`PlayerControllerComponent initialized for ${this.gameObject?.name}`);
        }
    }

    update(deltaTime: number): void {
        // --- Add Log ---
        if (!this.inputManager) {
            console.error(`PlayerControllerComponent (${this.gameObject?.name}): Update called but this.inputManager is missing!`);
            return; // Stop update if inputManager is missing
        }
        // --- End Log ---

        if (!this.gameObject) return;

        let dx = 0;
        let dy = 0;
        if (this.inputManager.isKeyDown('ArrowLeft') || this.inputManager.isKeyDown('KeyA')) {
            dx -= 1;
        }
        if (this.inputManager.isKeyDown('ArrowRight') || this.inputManager.isKeyDown('KeyD')) {
            dx += 1;
        }
        if (this.inputManager.isKeyDown('ArrowUp') || this.inputManager.isKeyDown('KeyW')) {
            dy -= 1;
        }
        if (this.inputManager.isKeyDown('ArrowDown') || this.inputManager.isKeyDown('KeyS')) {
            dy += 1;
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx = (dx / len);
            dy = (dy / len);
        }

        const oldX = this.gameObject.x;
        const oldY = this.gameObject.y;

        this.gameObject.x += dx * this.speed * deltaTime;
        this.gameObject.y += dy * this.speed * deltaTime;

        // Log position change only if moved
        if (this.gameObject.x !== oldX || this.gameObject.y !== oldY) {
            console.log(`PlayerController Pos: (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) -> (${this.gameObject.x.toFixed(1)}, ${this.gameObject.y.toFixed(1)})`);
        }

        // Bounds checking
        const spriteComp = this.gameObject.getComponent(SpriteComponent);
        const halfWidth = (spriteComp?.width || 0) / 2; // Use 0 if no spriteComp
        const halfHeight = (spriteComp?.height || 0) / 2;

        this.gameObject.x = Math.max(halfWidth, Math.min(this.bounds.width - halfWidth, this.gameObject.x));
        this.gameObject.y = Math.max(halfHeight, Math.min(this.bounds.height - halfHeight, this.gameObject.y));
    }

    destroy(): void {
        console.log(`PlayerControllerComponent destroyed for ${this.gameObject?.name}`);
    }
}
