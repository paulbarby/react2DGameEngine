import { IUpdateStrategy } from './IUpdateStrategy.js';
import { IGameObject } from '../../types/core.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { StrategyDependencies } from './StrategyFactory.js'; // Import dependency type

interface IdleStrategyConfig {
    animationName?: string;
}

/**
 * A simple strategy that does nothing except potentially play an idle animation.
 */
export class IdleStrategy implements IUpdateStrategy {
    private readonly animationName: string;

    /**
     * @param dependencies Dependencies injected by the factory (currently unused by IdleStrategy).
     * @param config Configuration for the idle behavior.
     * @param config.animationName Animation to play while idle. Defaults to 'idle'.
     */
    constructor(dependencies: StrategyDependencies, config?: IdleStrategyConfig) {
        // dependencies are ignored for now, but the parameter is required by the factory
        this.animationName = config?.animationName ?? 'idle';
    }

    onEnter(gameObject: IGameObject): void {
        console.log(`IdleStrategy (${gameObject.name}): Entering.`);
        gameObject.getComponent(AnimationComponent)?.play(this.animationName);
    }

    update(gameObject: IGameObject, deltaTime: number): void {
        // Do nothing
    }

    onExit(gameObject: IGameObject): void {
        console.log(`IdleStrategy (${gameObject.name}): Exiting.`);
        // Optional: Stop the idle animation if needed, though the next strategy's onEnter might handle it.
        // gameObject.getComponent(AnimationComponent)?.stop();
    }
}
