export interface AssetManifest {
    images: { [key: string]: string };
    sounds: { [key: string]: string };
    spriteSheets: { [key: string]: string };
    music: { [key: string]: string }; // Added music category
}

export interface AnimationDefinition {
    frames: string[]; // Array of sprite names (keys from SpriteDefinition.sprites)
    duration: number; // Total duration in seconds
    loop: boolean;
}

export interface SpriteDefinition {
    image: string; // Key of the image asset in AssetManifest
    frameWidth: number;
    frameHeight: number;
    sprites: { [name: string]: { x: number, y: number } }; // x, y are top-left coords in the sheet
    animations?: { [name: string]: AnimationDefinition };
}

export interface ComponentConfig {
    type: string; // Matches a registered component type name
    properties: { [key: string]: any };
}

export interface GameObjectConfig {
    id: string;
    name: string;
    type: string; // e.g., 'sprite', 'player', 'enemy' - for potential factory use
    x: number;
    y: number;
    layerId: string;
    components: ComponentConfig[];
}

export interface Layer {
    id: string;
    name: string;
    depth: number; // For rendering order
    visible: boolean;
}

export interface Scene {
    id: string;
    name: string;
    layers: Layer[];
    objects: GameObjectConfig[];
}

export interface Project {
    startScene: string; // Key of the starting scene
    scenes: { [name: string]: Scene };
}
