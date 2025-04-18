import { BaseComponent } from './BaseComponent.js';
import { InputManager } from '../input/InputManager.js';
import { ObjectManager } from '../objects/ObjectManager.js';
import { GameObjectConfig } from '../../types/project.js';
import { SoundManager } from '../sound/SoundManager.js'; // Import SoundManager

interface PlayerShootingProps {
    inputManager: InputManager;
    objectManager: ObjectManager;
    soundManager: SoundManager; // Add SoundManager
    bulletPrefab: Omit<GameObjectConfig, 'id' | 'x' | 'y'>; // Template for bullet
    fireRate: number; // Bullets per second
    bulletOffsetY?: number; // Offset from player anchor
}

export class PlayerShootingComponent extends BaseComponent {
    private inputManager: InputManager;
    private objectManager: ObjectManager;
    private soundManager: SoundManager; // Store SoundManager
    private bulletPrefab: Omit<GameObjectConfig, 'id' | 'x' | 'y'>;
    private fireCooldown: number;
    private timeSinceLastShot: number = 0;
    private bulletOffsetY: number;

    constructor(config: PlayerShootingProps) {
        super();
        this.inputManager = config.inputManager;
        this.objectManager = config.objectManager;
        this.soundManager = config.soundManager; // Initialize SoundManager
        this.bulletPrefab = config.bulletPrefab;
        this.fireCooldown = 1 / config.fireRate;
        this.bulletOffsetY = config.bulletOffsetY ?? 0;
        this.timeSinceLastShot = this.fireCooldown; // Allow shooting immediately
    }

    init(): void {}

    update(deltaTime: number): void {
        if (!this.gameObject) return;

        this.timeSinceLastShot += deltaTime;

        if (this.inputManager.isKeyDown('Space') && this.timeSinceLastShot >= this.fireCooldown) {
            this.fireBullet();
            this.timeSinceLastShot = 0;
        }
    }

    fireBullet(): void {
        if (!this.gameObject) return;

        const bulletId = `bullet_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
        const startX = this.gameObject.x;
        // Adjust Y based on offset (e.g., fire from front of ship)
        const startY = this.gameObject.y + this.bulletOffsetY;

        const bulletConfig: GameObjectConfig = {
            ...this.bulletPrefab,
            id: bulletId,
            name: `Bullet (${bulletId.substring(0, 4)})`,
            x: startX,
            y: startY,
        };

        // Create the bullet object using ObjectManager
        this.objectManager.createObjectFromConfig(bulletConfig);
        // Play shoot sound
        this.soundManager.playSound('laserShoot');

        console.log(`Fired bullet: ${bulletId} at (${startX.toFixed(0)}, ${startY.toFixed(0)})`);
    }

    destroy(): void {}
}
