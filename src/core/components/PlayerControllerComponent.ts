import { BaseComponent } from './BaseComponent.js';
import { InputManager } from '../input/InputManager.js';
import { SpriteComponent } from './SpriteComponent.js'; // Needed for bounds checking

interface PlayerControllerProps {
    speed: number;
    inputManager: InputManager;
    bounds: { width: number, height: number }; // Canvas dimensions
}

export class PlayerControllerComponent extends BaseComponent {
    private speed: number;
    private inputManager: InputManager;
    private bounds: { width: number, height: number };

    constructor(config: PlayerControllerProps) {
        super();
        this.speed = config.speed;
        this.inputManager = config.inputManager;
        this.bounds = config.bounds;
    }

    init(): void {
        console.log(`PlayerControllerComponent initialized for ${this.gameObject?.name}`);
    }

    update(deltaTime: number): void {
        if (!this.gameObject) return;
        console.log(`PlayerControllerComponent update called for ${this.gameObject.name}`); // Log update call

        let dx = 0;
        let dy = 0;
        if (this.inputManager.isKeyDown('ArrowLeft') || this.inputManager.isKeyDown('KeyA')) {
            console.log("PlayerController: LEFT DETECTED"); // Added log
            dx -= 1;
        }
        if (this.inputManager.isKeyDown('ArrowRight') || this.inputManager.isKeyDown('KeyD')) {
            console.log("PlayerController: RIGHT DETECTED"); // Added log
            dx += 1;
        }
        if (this.inputManager.isKeyDown('ArrowUp') || this.inputManager.isKeyDown('KeyW')) {
            console.log("PlayerController: UP DETECTED"); // Added log
            dy -= 1;
        }
        if (this.inputManager.isKeyDown('ArrowDown') || this.inputManager.isKeyDown('KeyS')) {
            console.log("PlayerController: DOWN DETECTED"); // Added log
            dy += 1;
        }

        // Log if any input was detected this frame by the component
        if (dx !== 0 || dy !== 0) {
            console.log(`PlayerController Input: dx=${dx}, dy=${dy}`);
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
