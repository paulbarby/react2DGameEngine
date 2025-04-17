export class InputManager {
    private keysDown: Set<string> = new Set();
    private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private mouseButtonsDown: Set<number> = new Set();
    private targetElement: HTMLElement | Window;

    // Optional: Track keys pressed/released this frame
    // private keysPressedThisFrame: Set<string> = new Set();
    // private keysReleasedThisFrame: Set<string> = new Set();

    constructor(targetElement: HTMLElement | Window = window) {
        this.targetElement = targetElement;

        // Bind event handlers to ensure 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.targetElement.addEventListener('keydown', this.handleKeyDown);
        this.targetElement.addEventListener('keyup', this.handleKeyUp);
        this.targetElement.addEventListener('mousemove', this.handleMouseMove);
        this.targetElement.addEventListener('mousedown', this.handleMouseDown);
        this.targetElement.addEventListener('mouseup', this.handleMouseUp);
        // Consider 'contextmenu' to prevent right-click menu if needed
        // this.targetElement.addEventListener('contextmenu', e => e.preventDefault());
    }

    private removeEventListeners(): void {
        this.targetElement.removeEventListener('keydown', this.handleKeyDown);
        this.targetElement.removeEventListener('keyup', this.handleKeyUp);
        this.targetElement.removeEventListener('mousemove', this.handleMouseMove);
        this.targetElement.removeEventListener('mousedown', this.handleMouseDown);
        this.targetElement.removeEventListener('mouseup', this.handleMouseUp);
        // Remove contextmenu listener if added
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.keysDown.has(event.code)) {
            // this.keysPressedThisFrame.add(event.code); // Track press start
        }
        this.keysDown.add(event.code);
        // console.log(`Key down: ${event.code}`);
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (this.keysDown.has(event.code)) {
            // this.keysReleasedThisFrame.add(event.code); // Track release
        }
        this.keysDown.delete(event.code);
        // console.log(`Key up: ${event.code}`);
    }

    private handleMouseMove(event: MouseEvent): void {
        // Adjust position based on target element (if not window)
        let rect: DOMRect | { left: 0, top: 0 } = { left: 0, top: 0 };
        if (this.targetElement instanceof HTMLElement) {
            rect = this.targetElement.getBoundingClientRect();
        }
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
        // console.log(`Mouse move: ${this.mousePosition.x}, ${this.mousePosition.y}`);
    }

    private handleMouseDown(event: MouseEvent): void {
        this.mouseButtonsDown.add(event.button);
        // console.log(`Mouse down: button ${event.button}`);
    }

    private handleMouseUp(event: MouseEvent): void {
        this.mouseButtonsDown.delete(event.button);
        // console.log(`Mouse up: button ${event.button}`);
    }

    // Called once per frame by the GameLoop
    update(): void {
        // Clear "pressed/released this frame" sets if using that pattern
        // this.keysPressedThisFrame.clear();
        // this.keysReleasedThisFrame.clear();
    }

    isKeyDown(key: string): boolean {
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

    getMousePosition(): { x: number, y: number } {
        // Return a copy to prevent external modification
        return { ...this.mousePosition };
    }

    isMouseButtonDown(button: number): boolean {
        // Common button numbers: 0=left, 1=middle, 2=right
        return this.mouseButtonsDown.has(button);
    }

    // Call this when the engine shuts down or the input target changes
    destroy(): void {
        this.removeEventListeners();
        this.keysDown.clear();
        this.mouseButtonsDown.clear();
        console.log('InputManager destroyed.');
    }
}
