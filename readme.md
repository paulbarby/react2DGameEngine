# Space Shooter Game Engine & Demos

**Author:** Paul Barby (paulbarby@gmail.com)

This repository contains a modular, canvas-based game engine built with TypeScript and a collection of demo scripts showcasing its capabilities. Each demo highlights different aspects of game development, from core mechanics to specific features like layering and UI.

---

## Core Engine Features

The engine is designed with a focus on modularity and flexibility, utilizing common game development patterns:

- **Component-Based Architecture:** Game objects are built by composing various components (e.g., `SpriteComponent`, `MovementComponent`, `CollisionComponent`), allowing for flexible entity creation and behavior definition.
- **Event Bus:** A decoupled event system (`EventBus`) facilitates communication between different engine systems and game objects without direct dependencies.
- **Asset Management:** An `AssetLoader` handles the asynchronous loading of images, sounds, music, and sprite sheet definitions defined in a central `manifest.json`.
- **Scene Management:** A `SceneManager` organizes game objects and layers within distinct scenes.
- **Rendering System:** A `Renderer` draws game objects onto the HTML Canvas, supporting layers, sprite sheets, animations, and basic transformations (position, rotation, scale).
- **Input Handling:** An `InputManager` captures keyboard and mouse input, publishing relevant events via the `EventBus`.
- **Sound System:** A `SoundManager` manages playback of sound effects and music, integrating with the `AssetLoader` and `SettingsManager` for volume control.
- **Collision Detection:** A basic `CollisionSystem` detects overlaps between game objects with `CollisionComponent`s and publishes collision events.
- **Settings Management:** A `SettingsManager` loads and saves game settings (like volume) potentially to local storage.
- **TypeScript:** Fully written in TypeScript for type safety and improved developer experience.

---

## Demos Overview

Each `.ts` file in the `src` directory (excluding core engine files) represents a runnable demo.

### 1. `main.ts`

**Purpose**: Core gameplay loop demonstration.

- Features: Player control (movement, shooting), basic enemy AI, projectile firing, collision detection (player-enemy, bullet-enemy), scoring, sound effects, and asset loading.

### 2. `layer-demo.ts`

**Purpose**: Demonstrates rendering layers and parallax scrolling.

- Features: Multiple layers (background, middle, foreground) with different depths, manual layer scrolling via arrow keys, parallax effect based on layer depth.

### 3. `rotation-demo.ts`

**Purpose**: Showcases object transformations.

- Features: Objects undergoing continuous rotation, uniform scaling (pulsing), non-uniform scaling, and orbiting behavior using the engine's transform properties.

### 4. `main-menu-demo.ts`

**Purpose**: Simulates a basic UI menu system.

- Features: Interactive menu buttons (Start, Options, Scores, Exit - visual only), placeholder panels for options/scores, integration with `SettingsManager` for potential settings persistence.

### 5. `music-demo.ts`

**Purpose**: Focuses on the background music system.

- Features: Loading and playing background music via `SoundManager`, UI controls for playback (Play/Pause) and volume adjustment, interaction with `SettingsManager` for volume levels.

### 6. `input-manager-test.ts`

**Purpose**: Tests and visualizes raw input handling.

- Features: Displays currently pressed keys, mouse coordinates relative to a target element, and mouse button states.

### 7. `behavior-strategy-demo.ts` (If applicable - based on file list)

**Purpose**: Demonstrates the Behavior Strategy pattern for AI or complex object logic.

- Features: Game objects using `BehaviorStrategyComponent` to switch between different behaviors dynamically.

### 8. `advanced-sprite-demo.ts` (If applicable - based on file list)

**Purpose**: Showcases advanced sprite sheet and animation features.

- Features: Loading sprites from definition files, playing named animations (`AnimationComponent`), potentially demonstrating different sprite configurations.

---

## Setup and Running Demos

### Prerequisites

- **Node.js and npm:** Required for installing dependencies and running the development server. Download from [nodejs.org](https://nodejs.org/).
- **A modern web browser:** Chrome, Firefox, Edge, Safari.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running a Demo

The project uses Vite for development, which provides a fast development server with Hot Module Replacement (HMR).

1.  **Modify `index.html`:**
    Open the main `web/index.html` file (or the relevant HTML file for the demos). Find the `<script>` tag that loads the main JavaScript module. Change the `src` attribute to point to the compiled JavaScript output of the demo you want to run. Vite handles the compilation from TypeScript.

    _Example: To run `main.ts`_

    ```html
    <!-- Inside web/index.html or a specific demo HTML -->
    <script type="module" src="/src/main.ts"></script>
    ```

    _Example: To run `layer-demo.ts`_

    ```html
    <!-- Inside web/index.html or a specific demo HTML -->
    <script type="module" src="/src/layer-demo.ts"></script>
    ```

    _(Adjust the path based on your project structure if needed)_

2.  **Start the development server:**
    ```bash
    npm run dev
    ```
3.  **Open your browser:**
    Navigate to the URL provided by Vite (usually `http://localhost:5173` or similar).

4.  **Switch demos:** To run a different demo, stop the server (Ctrl+C), change the `src` attribute in the HTML file again, and restart the server (`npm run dev`).

---

_This project was created by Paul Barby (paulbarby@gmail.com)._
