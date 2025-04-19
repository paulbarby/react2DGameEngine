import { IGameObject } from '../../types/core.js';

/**
 * Base interface for all application events.
 */
export interface BaseEvent {
    readonly type: string; // Unique identifier for the event type
    readonly timestamp: number; // High-resolution timestamp using performance.now()
}

/**
 * Event published when a collision between two game objects is detected.
 */
export interface CollisionEvent extends BaseEvent {
    readonly type: 'collisionDetected';
    readonly objectA: IGameObject;
    readonly objectB: IGameObject;
}

/**
 * Event published for user input actions (keyboard and mouse).
 */
export interface InputEvent extends BaseEvent {
    readonly type: 'keyDown' | 'keyUp' | 'mouseMove' | 'mouseDown' | 'mouseUp';
    readonly payload: any; // Specific data for the input type
    // Example payloads:
    // keyDown/keyUp: { key: string; code: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; }
    // mouseMove: { x: number; y: number; }
    // mouseDown/mouseUp: { x: number; y: number; button: number; }
}

/**
 * Event published when a game object is created or destroyed.
 */
export interface GameObjectEvent extends BaseEvent {
    readonly type: 'gameObjectCreated' | 'gameObjectDestroyed';
    readonly gameObject: IGameObject;
}

/**
 * Event published when a game setting changes.
 */
export interface SettingsChangeEvent extends BaseEvent {
    readonly type: 'settingsChanged';
    readonly changedSetting: string; // Key of the changed setting (e.g., 'volume.master')
    readonly newValue: any;
    readonly previousValue?: any; // Optional: Include the old value
}

/**
 * Event published for user interface interactions.
 */
export interface UIEvent extends BaseEvent {
    readonly type: 'buttonClicked' | 'sliderChanged' | 'toggleChanged' | 'selectChanged'; // Add more as needed
    readonly elementId: string; // ID of the HTML element that triggered the event
    readonly value?: any; // Optional value (e.g., slider value, checkbox state, selected option)
}

// --- Gameplay Events ---
export interface GameplayEvent {
    readonly type: 'gameplay'; // Specific type for gameplay events
    readonly subType: string; // Further specifies the gameplay event (e.g., 'enemyDestroyed')
    readonly timestamp: number;
    readonly payload: any; // Data specific to the gameplay event
}

// Add other specific event interfaces here...
// export interface NetworkEvent extends BaseEvent { ... }
// export interface GameStateEvent extends BaseEvent { ... }

/**
 * Union type representing any possible event in the application.
 * Add new event interfaces to this union.
 */
export type AppEvent =
    | CollisionEvent
    | InputEvent
    | GameObjectEvent
    | SettingsChangeEvent
    | UIEvent
    | GameplayEvent;
    // | NetworkEvent
    // | GameStateEvent;

/**
 * Type definition for callback functions that handle events.
 */
export type EventListenerCallback = (event: AppEvent) => void;

/**
 * Helper function to create a base event object.
 * Ensures timestamp is always added.
 */
function createBaseEvent(type: string): BaseEvent {
    // This function is no longer used directly by the specific creators below
    // but can be kept for potential future use or internal helpers.
    return { type, timestamp: performance.now() };
}

// --- Concrete Event Creator Functions (Optional but Recommended) ---

export function createCollisionEvent(objectA: IGameObject, objectB: IGameObject): CollisionEvent {
    // Explicitly set the type property to the literal type
    return { type: 'collisionDetected', timestamp: performance.now(), objectA, objectB };
}

export function createInputEvent(type: InputEvent['type'], payload: any): InputEvent {
    // Explicitly set the type property to the specific literal type passed in
    return { type: type, timestamp: performance.now(), payload };
}

export function createGameObjectEvent(type: GameObjectEvent['type'], gameObject: IGameObject): GameObjectEvent {
    // Explicitly set the type property to the specific literal type passed in
    return { type: type, timestamp: performance.now(), gameObject };
}

export function createSettingsChangeEvent(changedSetting: string, newValue: any, previousValue?: any): SettingsChangeEvent {
    // Explicitly set the type property to the literal type
    return { type: 'settingsChanged', timestamp: performance.now(), changedSetting, newValue, previousValue };
}

export function createUIEvent(type: UIEvent['type'], elementId: string, value?: any): UIEvent {
    // Explicitly set the type property to the specific literal type passed in
    return { type: type, timestamp: performance.now(), elementId, value };
}

/**
 * Creates a generic gameplay event object.
 * @param type The specific type of gameplay event (e.g., 'enemyDestroyed', 'powerupCollected').
 * @param payload Data relevant to the event.
 * @returns A gameplay event object.
 */
export function createGameplayEvent(type: string, payload: any): AppEvent { // Add export
    return {
        type: 'gameplay',
        subType: type,
        timestamp: Date.now(),
        payload: payload
    };
}
