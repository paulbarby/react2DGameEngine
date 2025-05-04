# Game Demos Suite

This repository contains a collection of modular, canvas-based game demo scripts using a custom engine architecture. Each demo showcases a different aspect of game development—ranging from input management to rendering, layering, and audio.

---

## Demos Overview

### 1. `main.ts`
**Purpose**: Core gameplay demo with:
- Player and enemy movement
- Shooting mechanics
- Collision detection
- Component-based object system
- Sound effects and asset loading

### 2. `layer-demo.ts`
**Purpose**: Parallax scrolling demo featuring:
- Multi-layer rendering (background, middle, foreground)
- Scroll offsets driven by arrow key input
- Per-layer parallax factors
- Object drawing adjusted per layer

### 3. `rotation-demo.ts`
**Purpose**: Object transformation effects demo:
- Continuous rotation
- Uniform and non-uniform scaling
- Pulsing and orbiting behaviors
- Demonstrates dynamic `rotation`, `scaleX`, and `scaleY` effects

### 4. `main-menu-demo.ts`
**Purpose**: UI interaction demo:
- Simulates a main menu with start, scores, options, and exit buttons
- Panels for options and scores
- Volume slider and toggle placeholders
- Integrates with `SettingsManager`

### 5. `music-demo.ts`
**Purpose**: Music system demonstration:
- Load and play music via `SoundManager`
- Volume control and playback UI
- Demonstrates use of `SettingsManager` for persistent volume settings

---

## Setup

### Prerequisites
- A modern browser (desktop recommended)
- Static file server (e.g. `http-server` or `live-server`)
- Directory structure:

