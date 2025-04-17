export class InputManager {
    // Optional: Track keys pressed/released this frame
    // private keysPressedThisFrame: Set<string> = new Set();
    // private keysReleasedThisFrame: Set<string> = new Set();
    constructor(targetElement = window) {
        this.keysDown = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtonsDown = new Set();
        this.targetElement = targetElement;
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
        console.log(`InputManager: Added listeners to ${this.targetElement === window ? 'window' : this.targetElement.id || 'HTMLElement'}`);
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
        // Prevent default browser behavior for relevant keys (scrolling, etc.)
        // Check if the target is NOT an input field to allow typing in inputs
        const targetTagName = (_a = event.target) === null || _a === void 0 ? void 0 : _a.tagName;
        const isInput = targetTagName === 'INPUT' || targetTagName === 'TEXTAREA' || targetTagName === 'SELECT';
        if (!isInput && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(keyboardEvent.code)) {
            console.log(`InputManager: Preventing default for ${keyboardEvent.code}`); // Log prevention
            keyboardEvent.preventDefault();
        }
        // Log only if it's a new key press
        if (!this.keysDown.has(keyboardEvent.code)) {
            console.log(`InputManager: Key down - ${keyboardEvent.code}`); // Added log
            // this.keysPressedThisFrame.add(keyboardEvent.code); // Track press start
        }
        this.keysDown.add(keyboardEvent.code);
    }
    handleKeyUp(event) {
        const keyboardEvent = event; // Type assertion
        if (this.keysDown.has(keyboardEvent.code)) {
            console.log(`InputManager: Key up - ${keyboardEvent.code}`); // Added log
            // this.keysReleasedThisFrame.add(keyboardEvent.code); // Track release
        }
        this.keysDown.delete(keyboardEvent.code);
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
        // console.log(`Mouse move: ${this.mousePosition.x}, ${this.mousePosition.y}`);
    }
    handleMouseDown(event) {
        const mouseEvent = event; // Type assertion
        this.mouseButtonsDown.add(mouseEvent.button);
        // console.log(`Mouse down: button ${mouseEvent.button}`);
    }
    handleMouseUp(event) {
        const mouseEvent = event; // Type assertion
        this.mouseButtonsDown.delete(mouseEvent.button);
        // console.log(`Mouse up: button ${mouseEvent.button}`);
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
        console.log('InputManager destroyed.');
    }
}
