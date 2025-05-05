# How-To Guide & Tutorial Structure

This document outlines the standard structure for creating "How-To" guides and tutorials for the various engine demos and core systems. Each guide should aim to explain both the underlying engine mechanics and how the specific demo showcasing those mechanics is implemented.

**General Guidelines:**

- Keep explanations clear and concise.
- Use code blocks (`typescript`, `html`, `json`, etc.) for examples.
- Assume the reader has basic familiarity with TypeScript and web development concepts.
- Link back to the actual demo page near the top.
- List key files involved at the end or within relevant sections.

---

## Standard Sections

Each How-To guide should ideally include the following sections:

### `[Link back to the Demo Page]`

Example: `<p><a href="/[demo-url]">&laquo; Back to the Demo</a></p>`

### `## 1. Understanding the [System Name]`

**(Example: `## 1. Understanding the AssetLoader`)**

- **Purpose:** Explain the core responsibility of the engine system being demonstrated (e.g., loading assets, handling input, detecting collisions).
- **Role in Engine:** Describe how this system fits into the overall game engine architecture.
- **Core Mechanics:** Briefly explain how it works internally.
  - What browser APIs does it leverage (e.g., `fetch`, `AudioContext`, `Canvas API`, `addEventListener`)?
  - How does it interact with other engine systems (e.g., `EventBus`, `Renderer`, `ObjectManager`)?
  - What data structures does it manage (e.g., `Map` of loaded assets, `Set` of keys down)?
- **Supporting Files/Concepts:** Mention any crucial related files or concepts needed to use or understand the system (e.g., `manifest.json`, `_def.json` files, specific event types from `EventTypes.ts`, the need for a target HTML element).
- **Importance:** Briefly state why this system is important for making games.

### `## 2. Tutorial: Using the [System Name]`

**(Example: `## 2. Tutorial: Using the InputManager`)**

- **Basis:** Clearly state that this tutorial follows the implementation pattern used in the corresponding demo script (e.g., `src/[demo-name]-test.ts` or `src/[demo-name].ts`).
- **Step-by-Step Implementation:**
  - **Initialization:** Show how to import necessary classes, get references to required HTML elements (if any), and instantiate the system (including dependencies like `EventBus`, `AudioContext`, target elements).
  - **Core Functionality:** Provide code examples demonstrating the primary usage of the system.
    - Calling key methods (e.g., `assetLoader.loadManifest()`, `inputManager.isKeyDown()`, `collisionSystem.update()`).
    - Configuring the system (if applicable).
    - Accessing data managed by the system (e.g., `assetLoader.getAsset()`, `inputManager.getMousePosition()`).
  - **Event Handling (If Applicable):** Show how to subscribe to events published by the system or how the system subscribes to events from others (using `eventBus.subscribe()`). Include example callback functions.
  - **Cleanup:** Emphasize the importance of calling `destroy()` methods (if they exist) to remove listeners or release resources, often in a `beforeunload` handler or when a component unmounts.
- **Explanations & Tips:** Provide clear explanations for each code snippet. Include notes (`<div class="note">...</div>` or similar) for important tips, best practices, common pitfalls, or alternative approaches.

### `## 3. Advanced Usage & Features`

**(Example: `## 3. Advanced Usage & Features`)**

- **(Optional but Recommended)**
- **Potential Extensions:** Discuss how the system could be extended or used in more complex scenarios.
- **Interesting Mechanics:** Highlight any particularly clever or interesting internal design choices or features.
- **Synergies:** Show examples of how this system can be combined effectively with other engine systems.
- **Configuration Options:** Detail any less common configuration options or parameters.

### `## 4. How the "[Demo Name]" Demo Works`

**(Example: `## 4. How the "AssetLoader Test" Demo Works`)**

- **Demo Purpose:** Briefly restate the specific goal of the demo page (e.g., "to visualize the asset loading process", "to show real-time input state").
- **HTML Structure (`web/[demo-name].html`):**
  - Describe the key HTML elements used in the demo page.
  - Explain the role of each element (e.g., the button triggers loading, the `<pre>` tag displays logs, the `<div>` shows status, the `<canvas>` is the rendering target).
  - Mention any specific attributes like `tabindex="0"` if relevant.
- **Script Interaction (`src/[demo-name]-test.ts` or `src/[demo-name].ts`):**
  - Explain how the demo's TypeScript code connects to the HTML elements (e.g., `document.getElementById`).
  - Describe the main functions or logic flow in the script.
  - Explain how the script uses the core engine system being demonstrated.
  - Detail how the script updates the HTML elements to provide visual feedback (e.g., updating `textContent`, changing styles, drawing on the canvas).
- **Key Files:** List the essential files needed to run and understand this specific demo (HTML file, TS script, core system file(s), relevant JSON config/definition files).

---

By following this structure, the How-To guides will provide comprehensive and consistent explanations for users learning about the game engine and its various components.
