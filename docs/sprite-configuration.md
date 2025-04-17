# Sprite Configuration Guide

This guide explains how to configure sprites for use within the game engine, covering both single images and sprite sheets.

## Core Concepts

- **`manifest.json`**: The central file (`public/assets/manifest.json`) that lists all assets (images, sounds, sprite sheet definitions) the `AssetLoader` should know about.
- **`SpriteComponent`**: The component attached to a `GameObject` responsible for holding sprite information. Its key property is `spriteRef`.
- **`spriteRef`**: A string within the `SpriteComponent`'s properties that tells the engine _which_ visual to display. It can be in one of two formats:
  1.  **Direct Image Key**: e.g., `"playerShip"`
  2.  **Sprite Sheet Reference**: e.g., `"playerSheet/idle"`
- **Sprite Sheet Definition (`_def.json`)**: A JSON file describing a sprite sheet image, including frame dimensions and the locations of individual sprites within it.

## Method 1: Using a Direct Image

This method is suitable for sprites that are single image files and don't require animation frames from a sheet.

1.  **Add Image to Manifest:**

    - Ensure your image file (e.g., `enemy.png`) is in the `public/assets/images/` directory.
    - Open `public/assets/manifest.json`.
    - Add an entry under the `images` section, giving your image a unique key:
      ```json
      {
        "images": {
          "playerShip": "/assets/images/player.png",
          "enemyShip": "/assets/images/enemy.png" // Added enemyShip
        }
        // ... other sections ...
      }
      ```

2.  **Configure `SpriteComponent`:**
    - When defining your `GameObjectConfig` (e.g., in `advanced-sprite-demo.ts`), add a `SpriteComponent`.
    - Set the `spriteRef` property to the **image key** you defined in the manifest.
    - Optionally, set `width` and `height` properties if you want to display the sprite at a size different from its natural image dimensions. If omitted, the renderer will use the image's dimensions.
      ```typescript
      // Example GameObjectConfig
      {
          id: 'enemy_1', name: 'Enemy 1', type: 'enemy',
          // ... other properties ...
          components: [
              {
                  type: 'SpriteComponent',
                  properties: {
                      spriteRef: 'enemyShip', // Use the image key directly
                      width: 32,          // Optional: Force display width
                      height: 32          // Optional: Force display height
                  }
              },
              // ... other components ...
          ]
      }
      ```

**How it Works:**

- `AssetLoader` loads `enemyShip` image based on the manifest.
- `SpriteComponent` parses `spriteRef: "enemyShip"`. Since it lacks '/', it stores `"enemyShip"` as the `imageKey`.
- `Renderer` sees the `imageKey` is set, retrieves the corresponding image from `AssetLoader`, and draws it. If `width`/`height` were set in the component, it uses those for drawing dimensions; otherwise, it uses the image's natural dimensions.

## Method 2: Using a Sprite Sheet

This method is used for sprites that are part of a larger image containing multiple frames or related images. It's essential for animations.

1.  **Create Sprite Sheet Definition (`_def.json`):**

    - Create a JSON file (e.g., `player_def.json`) in `public/assets/defs/`.
    - Define the structure:
      - `image`: The **image key** (from `manifest.json`) of the sprite sheet image itself (e.g., `"playerShip"`).
      - `frameWidth`, `frameHeight`: The dimensions of a single frame/sprite within the sheet.
      - `sprites`: An object mapping **sprite names** (e.g., `"idle"`, `"thrust"`) to their top-left `{x, y}` coordinates within the sheet.
      - `animations` (Optional): Define named animations using the sprite names.
      ```json
      // Example: public/assets/defs/player_def.json
      {
        "image": "playerShip", // Key from manifest.json images
        "frameWidth": 64,
        "frameHeight": 96,
        "sprites": {
          "idle": { "x": 0, "y": 0 },
          "thrust": { "x": 64, "y": 0 }
        },
        "animations": {
          // Optional
          "flying": {
            "frames": ["idle", "thrust"],
            "duration": 0.5,
            "loop": true
          }
        }
      }
      ```

2.  **Add Image and Definition to Manifest:**

    - Ensure the sprite sheet image (e.g., `player.png`) is listed under `images` in `manifest.json`.
    - Add the definition file (`player_def.json`) under the `spriteSheets` section, giving it a unique **sheet key**.
      ```json
      {
        "images": {
          "playerShip": "/assets/images/player.png", // Image used by the sheet
          "enemyShip": "/assets/images/enemy.png"
        },
        // ... sounds ...
        "spriteSheets": {
          "playerSheet": "/assets/defs/player_def.json", // Added sheet definition
          "enemySheet": "/assets/defs/enemy_def.json" // Example for enemy
        }
      }
      ```

3.  **Configure `SpriteComponent`:**
    - When defining your `GameObjectConfig`, add a `SpriteComponent`.
    - Set the `spriteRef` property using the format `"sheetKey/spriteName"`.
    - Usually, you _don't_ need to set `width` and `height` here, as the `Renderer` will use `frameWidth` and `frameHeight` from the definition file. You _can_ still override them if needed.
      ```typescript
      // Example GameObjectConfig
      {
          id: 'player', name: 'Player', type: 'player',
          // ... other properties ...
          components: [
              {
                  type: 'SpriteComponent',
                  properties: {
                      // Use "sheetKey/spriteName" format
                      spriteRef: 'playerSheet/idle'
                      // Width/Height usually omitted, derived from definition
                  }
              },
              // ... other components ...
          ]
      }
      ```

**How it Works:**

- `AssetLoader` loads the `playerShip` image and the `playerSheet` definition JSON based on the manifest.
- `SpriteComponent` parses `spriteRef: "playerSheet/idle"`. It splits by '/', storing `"playerSheet"` as `currentSheetKey` and `"idle"` as `currentSpriteName`.
- `Renderer` sees `currentSheetKey` is set. It retrieves the `playerSheet` definition from `AssetLoader`. Using the definition and `currentSpriteName` (`"idle"`), it finds the correct `image` key (`"playerShip"`), the source rectangle (`sx`, `sy` from `sprites["idle"]`, `sw`, `sh` from `frameWidth`/`frameHeight`), and the image itself. It then draws the specified frame. The component's `width`/`height` default to the frame dimensions unless explicitly overridden.

By following these steps, you can correctly configure sprites whether they are standalone images or part of a sprite sheet.
