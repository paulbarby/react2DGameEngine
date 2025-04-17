import { SpriteDefinition } from './project';

// Forward declaration for circular dependency
export interface IGameObject {
    readonly id: string;
    name: string;
    x: number;
    y: number;
    rotation: number; // in radians
    scaleX: number;
    scaleY: number;
    readonly components: ReadonlyArray<IComponent>;

    update(deltaTime: number): void;
    addComponent(component: IComponent): void;
    getComponent<T extends IComponent>(typeConstructor: { new(...args: any[]): T }): T | undefined;
    destroy(): void;
}

export interface IComponent {
    gameObject: IGameObject | null;
    init(): void;
    update(deltaTime: number): void;
    destroy(): void;
}

export type Asset = HTMLImageElement | AudioBuffer | SpriteDefinition | any; // Allow any for generic JSON

export type LoadedAssets = Map<string, Asset>;
