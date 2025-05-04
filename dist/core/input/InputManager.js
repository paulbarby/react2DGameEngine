import { createInputEvent } from '../events/EventTypes.js'; // Import event creator
import { info, debug } from '../utils/logger.js'; // Import logger functions
export class InputManager {
    // Optional: Track keys pressed/released this frame
    // private keysPressedThisFrame: Set<string> = new Set();
    // private keysReleasedThisFrame: Set<string> = new Set();
    constructor(targetElement = window, eventBus) {
        this.keysDown = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtonsDown = new Set();
        this.targetElement = targetElement;
        this.eventBus = eventBus; // Store EventBus instance
        // Bind event handlers to ensure 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.addEventListeners();
    }
    addEventListeners() {
        this.targetElement.addEventListener('keydown', this.handleKeyDown);
        this.targetElement.addEventListener('keyup', this.handleKeyUp);
        this.targetElement.addEventListener('mousemove', this.handleMouseMove);
        this.targetElement.addEventListener('mousedown', this.handleMouseDown);
        this.targetElement.addEventListener('mouseup', this.handleMouseUp);
        // Log confirmation
        info(`InputManager: Added listeners to ${this.targetElement === window ? 'window' : this.targetElement.id || 'HTMLElement'}`); // Use logger
        // Consider 'contextmenu' to prevent right-click menu if needed
        // this.targetElement.addEventListener('contextmenu', e => e.preventDefault());
    }
    removeEventListeners() {
        this.targetElement.removeEventListener('keydown', this.handleKeyDown);
        this.targetElement.removeEventListener('keyup', this.handleKeyUp);
        this.targetElement.removeEventListener('mousemove', this.handleMouseMove);
        this.targetElement.removeEventListener('mousedown', this.handleMouseDown);
        this.targetElement.removeEventListener('mouseup', this.handleMouseUp);
        // Remove contextmenu listener if added
    }
    handleKeyDown(event) {
        var _a;
        const keyboardEvent = event; // Type assertion
        const { code, key, ctrlKey, shiftKey, altKey } = keyboardEvent;
        // Prevent default browser behavior for relevant keys (scrolling, etc.)
        // Check if the target is NOT an input field to allow typing in inputs
        const targetTagName = (_a = event.target) === null || _a === void 0 ? void 0 : _a.tagName;
        const isInput = targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT';
        if (!isInput && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
            debug(`InputManager: Preventing default for ${code}`); // Use logger (debug)
            keyboardEvent.preventDefault();
        }
        // Log only if it's a new key press
        if (!this.keysDown.has(code)) {
            debug(`InputManager: Key down - ${code}`); // Use logger (debug)
            // this.keysPressedThisFrame.add(code); // Track press start
            // Publish event
            this.eventBus.publish(createInputEvent('keyDown', { code, key, ctrlKey, shiftKey, altKey }));
        }
        this.keysDown.add(code);
    }
    handleKeyUp(event) {
        const keyboardEvent = event; // Type assertion
        const { code, key, ctrlKey, shiftKey, altKey } = keyboardEvent;
        if (this.keysDown.has(code)) {
            debug(`InputManager: Key up - ${code}`); // Use logger (debug)
            // this.keysReleasedThisFrame.add(code); // Track release
            // Publish event
            this.eventBus.publish(createInputEvent('keyUp', { code, key, ctrlKey, shiftKey, altKey }));
        }
        this.keysDown.delete(code);
    }
    handleMouseMove(event) {
        const mouseEvent = event; // Type assertion
        // Adjust position based on target element (if not window)
        let rect = { left: 0, top: 0 };
        if (this.targetElement instanceof HTMLElement) {
            rect = this.targetElement.getBoundingClientRect();
        }
        this.mousePosition.x = mouseEvent.clientX - rect.left;
        this.mousePosition.y = mouseEvent.clientY - rect.top;
        // Publish event
        this.eventBus.publish(createInputEvent('mouseMove', { x: this.mousePosition.x, y: this.mousePosition.y }));
        // debug(`Mouse move: ${this.mousePosition.x}, ${this.mousePosition.y}`); // Use logger (debug)
    }
    handleMouseDown(event) {
        const mouseEvent = event; // Type assertion
        const button = mouseEvent.button;
        // Adjust position based on target element (if not window)
        let rect = { left: 0, top: 0 };
        if (this.targetElement instanceof HTMLElement) {
            rect = this.targetElement.getBoundingClientRect();
        }
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        this.mouseButtonsDown.add(button);
        // Publish event
        this.eventBus.publish(createInputEvent('mouseDown', { x, y, button }));
        debug(`Mouse down: button ${mouseEvent.button}`); // Use logger (debug)
    }
    handleMouseUp(event) {
        const mouseEvent = event; // Type assertion
        const button = mouseEvent.button;
        // Adjust position based on target element (if not window)
        let rect = { left: 0, top: 0 };
        if (this.targetElement instanceof HTMLElement) {
            rect = this.targetElement.getBoundingClientRect();
        }
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        this.mouseButtonsDown.delete(button);
        // Publish event
        this.eventBus.publish(createInputEvent('mouseUp', { x, y, button }));
        debug(`Mouse up: button ${mouseEvent.button}`); // Use logger (debug)
    }
    // Called once per frame by the GameLoop
    update() {
        // Clear "pressed/released this frame" sets if using that pattern
        // this.keysPressedThisFrame.clear();
        // this.keysReleasedThisFrame.clear();
    }
    isKeyDown(key) {
        return this.keysDown.has(key);
    }
    // Optional: Check if key was pressed exactly this frame
    // isKeyPressed(key: string): boolean {
    //     return this.keysPressedThisFrame.has(key);
    // }
    // Optional: Check if key was released exactly this frame
    // isKeyReleased(key: string): boolean {
    //     return this.keysReleasedThisFrame.has(key);
    // }
    getMousePosition() {
        // Return a copy to prevent external modification
        return Object.assign({}, this.mousePosition);
    }
    isMouseButtonDown(button) {
        // Common button numbers: 0=left, 1=middle, 2=right
        return this.mouseButtonsDown.has(button);
    }
    // Call this when the engine shuts down or the input target changes
    destroy() {
        this.removeEventListeners();
        this.keysDown.clear();
        this.mouseButtonsDown.clear();
        // No need to clear eventBus listeners here, let consumers manage subscriptions
        info('InputManager destroyed.'); // Use logger
    }
}
