import { IComponent, IGameObject } from '../../types/core';

export abstract class BaseComponent implements IComponent {
    public gameObject: IGameObject | null = null;

    // Concrete implementations must provide these methods
    abstract init(): void;
    abstract update(deltaTime: number): void;
    abstract destroy(): void;
}
