// Add the .js extension for browser ES module resolution
import { InputManager } from './core/input/InputManager.js';
console.log('InputManager test script loaded.');
const keysDownEl = document.getElementById('keys-down');
const mousePosEl = document.getElementById('mouse-pos');
const mouseButtonsEl = document.getElementById('mouse-buttons');
const targetEl = document.getElementById('target'); // Added type assertion
const mouseDisplayEl = document.getElementById('mouse-display');
if (!keysDownEl || !mousePosEl || !mouseButtonsEl || !targetEl || !mouseDisplayEl) {
    console.error('Required HTML elements not found!');
}
else {
    // Instantiate InputManager, targeting the blue box
    const inputManager = new InputManager(targetEl);
    // Function to update the display
    function updateDisplay() {
        // Keys Down
        const keys = Array.from(inputManager.keysDown); // Access private for demo
        keysDownEl.textContent = JSON.stringify(keys);
        // Mouse Position
        const mousePos = inputManager.getMousePosition();
        mousePosEl.textContent = `x: ${mousePos.x.toFixed(0)}, y: ${mousePos.y.toFixed(0)}`;
        mouseDisplayEl.textContent = `Mouse Pos: ${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)}`;
        // Ensure mouse display stays within the target bounds visually
        // Use non-null assertion operator (!) since we checked for null above
        const displayX = Math.max(0, Math.min(mousePos.x, targetEl.clientWidth - mouseDisplayEl.offsetWidth));
        const displayY = Math.max(0, Math.min(mousePos.y, targetEl.clientHeight - mouseDisplayEl.offsetHeight));
        mouseDisplayEl.style.left = `${displayX}px`;
        mouseDisplayEl.style.top = `${displayY}px`;
        // Mouse Buttons Down
        const buttons = Array.from(inputManager.mouseButtonsDown); // Access private for demo
        mouseButtonsEl.textContent = JSON.stringify(buttons);
        // Call update on InputManager (though it doesn't do much in this version)
        inputManager.update();
        // Request next frame
        requestAnimationFrame(updateDisplay);
    }
    // Start the display loop
    requestAnimationFrame(updateDisplay);
    console.log('InputManager instantiated and display loop started.');
    // Optional: Cleanup on window unload
    window.addEventListener('beforeunload', () => {
        inputManager.destroy();
    });
}
