import { AppEvent, EventListenerCallback } from './EventTypes.js';

/**
 * A simple event bus for publishing and subscribing to application-wide events.
 */
export class EventBus {
    private listeners: Map<string, Set<EventListenerCallback>> = new Map();

    /**
     * Subscribes a callback function to a specific event type.
     * @param eventType The type of event to subscribe to (e.g., 'collisionDetected').
     * @param callback The function to execute when the event is published.
     * @returns A function that can be called to unsubscribe the listener.
     */
    subscribe(eventType: string, callback: EventListenerCallback): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        const listenersSet = this.listeners.get(eventType)!; // Assert non-null as we just created it if needed
        listenersSet.add(callback);

        // Return an unsubscribe function
        return () => this.unsubscribe(eventType, callback);
    }

    /**
     * Unsubscribes a callback function from a specific event type.
     * @param eventType The type of event to unsubscribe from.
     * @param callback The callback function to remove.
     */
    unsubscribe(eventType: string, callback: EventListenerCallback): void {
        const listenersSet = this.listeners.get(eventType);
        if (listenersSet) {
            listenersSet.delete(callback);
            // Optional: Clean up the map entry if the set becomes empty
            if (listenersSet.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }

    /**
     * Publishes an event to all subscribed listeners.
     * @param event The event object to publish. Must conform to BaseEvent.
     */
    publish(event: AppEvent): void {
        const listenersSet = this.listeners.get(event.type);
        if (listenersSet) {
            // Iterate over a copy of the set in case a listener unsubscribes itself during execution
            [...listenersSet].forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error(`Error in event listener for type "${event.type}":`, error);
                    // Optionally, add more robust error handling or reporting
                }
            });
        }
    }

    /**
     * Clears all listeners for a specific event type or all listeners if no type is provided.
     * @param eventType Optional. The type of event to clear listeners for.
     */
    clearListeners(eventType?: string): void {
        if (eventType) {
            this.listeners.delete(eventType);
            console.log(`Cleared listeners for event type: ${eventType}`);
        } else {
            this.listeners.clear();
            console.log('Cleared all listeners from EventBus.');
        }
    }
}
