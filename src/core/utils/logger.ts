import { SettingsManager } from '../settings/SettingsManager.js';
import { LogLevel } from '../../types/project.js';

// Define numerical levels for comparison
const LogLevelValue: { [key in LogLevel]: number } = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4,
};

// Module-level variable to store the current threshold
let currentLogLevelNumber: number = LogLevelValue.INFO; // Default level

/**
 * Initializes the logger system with the log level from settings.
 * Should be called once after SettingsManager has loaded settings.
 * @param settingsManager The initialized SettingsManager instance.
 */
export function initializeLogger(settingsManager: SettingsManager): void {
    const debugSettings = settingsManager.getDebugSettings();
    const configuredLevel = debugSettings?.logLevel || 'INFO'; // Default to INFO if not found
    currentLogLevelNumber = LogLevelValue[configuredLevel] ?? LogLevelValue.INFO;
    info(`Logger initialized with level: ${configuredLevel} (Value: ${currentLogLevelNumber})`);

    // Optional: Listen for settings changes to update log level dynamically
    // This requires SettingsManager to publish an event for 'debug.logLevel' changes
    // settingsManager.eventBus?.subscribe('settingsChanged', (event) => {
    //     if (event.key === 'debug.logLevel') {
    //         const newLevel = event.newValue as LogLevel;
    //         currentLogLevelNumber = LogLevelValue[newLevel] ?? LogLevelValue.INFO;
    //         info(`Logger level updated to: ${newLevel}`);
    //     }
    // });
}

/**
 * Logs a debug message if the current log level allows it.
 * @param message The main message or object to log.
 * @param optionalParams Additional objects/values to log.
 */
export function debug(message?: any, ...optionalParams: any[]): void {
    if (currentLogLevelNumber <= LogLevelValue.DEBUG) {
        console.debug(message, ...optionalParams);
    }
}

/**
 * Logs an informational message if the current log level allows it.
 * @param message The main message or object to log.
 * @param optionalParams Additional objects/values to log.
 */
export function info(message?: any, ...optionalParams: any[]): void {
    if (currentLogLevelNumber <= LogLevelValue.INFO) {
        console.log(message, ...optionalParams); // Use console.log for info level
    }
}

/**
 * Logs a warning message if the current log level allows it.
 * @param message The main message or object to log.
 * @param optionalParams Additional objects/values to log.
 */
export function warn(message?: any, ...optionalParams: any[]): void {
    if (currentLogLevelNumber <= LogLevelValue.WARN) {
        console.warn(message, ...optionalParams);
    }
}

/**
 * Logs an error message if the current log level allows it.
 * @param message The main message or object to log.
 * @param optionalParams Additional objects/values to log.
 */
export function error(message?: any, ...optionalParams: any[]): void {
    if (currentLogLevelNumber <= LogLevelValue.ERROR) {
        console.error(message, ...optionalParams);
    }
}
