import { EventBus } from '../events/EventBus.js';
import { createSettingsChangeEvent } from '../events/EventTypes.js';
import { LogLevel } from '../../types/project.js'; // Import LogLevel
import { info, warn, error } from '../utils/logger.js'; // Import logger functions

interface GameSettings {
    volume: {
        master: number;
        music: number;
        sfx: number;
    };
    controls: {
        invertY: boolean;
    };
    debug: { // Add debug settings section
        logLevel: LogLevel;
    };
    // Add other settings categories as needed
}

export class SettingsManager {
    private settings: GameSettings | null = null;
    private settingsUrl: string;
    private listeners: Map<keyof GameSettings['volume'], Set<(value: number) => void>> = new Map();
    private eventBus: EventBus | null = null;

    constructor(settingsUrl: string = '/config/settings.json') {
        this.settingsUrl = settingsUrl;
        // Initialize listener sets
        this.listeners.set('master', new Set());
        this.listeners.set('music', new Set());
        this.listeners.set('sfx', new Set());
    }

    // Method to set the EventBus
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    // Make loadSettings return the settings object or null
    async loadSettings(): Promise<GameSettings | null> {
        try {
            info("SettingsManager: Starting fetch for settings..."); // Use logger
            const response = await fetch(this.settingsUrl);
            info(`SettingsManager: Fetch response status: ${response.status}`); // Use logger
            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.statusText}`);
            }
            const loadedData = await response.json();
            info("SettingsManager: JSON parsed:", loadedData); // Use logger

            // Basic validation
            if (!loadedData?.volume || typeof loadedData.volume.master !== 'number' || !loadedData?.debug?.logLevel) { // Check logLevel too
                 error("Loaded settings missing required properties (volume, debug.logLevel) or invalid format."); // Use logger
                 throw new Error("Invalid settings format");
            }

            this.settings = loadedData as GameSettings; // Assign validated data
            info('SettingsManager: Settings assigned successfully:', this.settings); // Use logger

            // --- REMOVE NOTIFY LISTENERS FROM HERE ---
            // Listeners will be notified only when setXxxVolume is called later.
            // Initial values are read directly by consumers after loadSettings completes.
            // this.notifyVolumeListeners('master', this.getMasterVolume());
            // this.notifyVolumeListeners('music', this.getMusicVolumeMultiplier());
            // this.notifyVolumeListeners('sfx', this.getSfxVolumeMultiplier());
            // --- END REMOVAL ---

            return this.settings; // Return the loaded settings
        } catch (err) { // Use different variable name
            error('Error loading settings:', err); // Use logger
            this.settings = this.getDefaultSettings();
            warn('Using default settings due to loading error.'); // Use logger

            // --- REMOVE NOTIFY LISTENERS FROM HERE (Error Case) ---
            // this.notifyVolumeListeners('master', this.getMasterVolume());
            // this.notifyVolumeListeners('music', this.getMusicVolumeMultiplier());
            // this.notifyVolumeListeners('sfx', this.getSfxVolumeMultiplier());
            // --- END REMOVAL ---

            return this.settings; // Return default settings on error
        }
    }

    private getDefaultSettings(): GameSettings {
        info("SettingsManager: Returning DEFAULT settings object."); // Use logger
        // Define hardcoded defaults in case loading fails
        return {
            volume: { master: 0.8, music: 1.0, sfx: 1.0 },
            controls: { invertY: false },
            debug: { logLevel: 'INFO' } // Add default debug settings
        };
    }

    // --- Volume Getters ---
    getMasterVolume(): number {
        // info('Getter this.settings:', this.settings); // Keep logs minimal or use debug level
        // info('Getter this.settings.volume:', this.settings?.volume);
        const settingsAvailable = !!this.settings;
        const masterValue = this.settings?.volume?.master;
        const defaultValue = this.getDefaultSettings().volume.master;
        const result = masterValue ?? defaultValue;
        // info(`SettingsManager.getMasterVolume(): Settings available=${settingsAvailable}, Value=${masterValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    getMusicVolumeMultiplier(): number {
        // info('Getter this.settings.volume:', this.settings?.volume);
        const settingsAvailable = !!this.settings;
        const musicValue = this.settings?.volume?.music;
        const defaultValue = this.getDefaultSettings().volume.music;
        const result = musicValue ?? defaultValue;
        // info(`SettingsManager.getMusicVolumeMultiplier(): Settings available=${settingsAvailable}, Value=${musicValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    getSfxVolumeMultiplier(): number {
        // info('Getter this.settings.volume:', this.settings?.volume);
        const settingsAvailable = !!this.settings;
        const sfxValue = this.settings?.volume?.sfx;
        const defaultValue = this.getDefaultSettings().volume.sfx;
        const result = sfxValue ?? defaultValue;
        // info(`SettingsManager.getSfxVolumeMultiplier(): Settings available=${settingsAvailable}, Value=${sfxValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    // --- Volume Setters ---
    setMasterVolume(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0 && value <= 1) {
            const clampedValue = Math.max(0, Math.min(1, value));
            const previousValue = this.settings.volume.master;
            if (previousValue !== clampedValue) {
                this.settings.volume.master = clampedValue;
                info(`SettingsManager: Master Volume set to ${clampedValue}`); // Use logger
                this.notifyVolumeListeners('master', clampedValue);
                if (this.eventBus) {
                    this.eventBus.publish(createSettingsChangeEvent('volume.master', clampedValue, previousValue));
                }
                // TODO: Persist settings
            }
        } else {
            warn(`Invalid value provided for master volume: ${value}`); // Use logger
        }
    }

    setMusicVolumeMultiplier(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0) {
            const clampedValue = Math.max(0, Math.min(1, value));
            const previousValue = this.settings.volume.music;
            if (previousValue !== clampedValue) {
                this.settings.volume.music = clampedValue;
                info(`SettingsManager: Music Volume Multiplier set to ${clampedValue}`); // Use logger
                this.notifyVolumeListeners('music', clampedValue);
                if (this.eventBus) {
                    this.eventBus.publish(createSettingsChangeEvent('volume.music', clampedValue, previousValue));
                }
                // TODO: Persist settings
            }
        } else {
            warn(`Invalid value provided for music volume multiplier: ${value}`); // Use logger
        }
    }

    setSfxVolumeMultiplier(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0) {
             const clampedValue = Math.max(0, Math.min(1, value));
             const previousValue = this.settings.volume.sfx;
            if (previousValue !== clampedValue) {
                this.settings.volume.sfx = clampedValue;
                info(`SettingsManager: SFX Volume Multiplier set to ${clampedValue}`); // Use logger
                this.notifyVolumeListeners('sfx', clampedValue);
                if (this.eventBus) {
                    this.eventBus.publish(createSettingsChangeEvent('volume.sfx', clampedValue, previousValue));
                }
                // TODO: Persist settings
            }
        } else {
            warn(`Invalid value provided for sfx volume multiplier: ${value}`); // Use logger
        }
    }

    // --- Listener Methods ---
    addVolumeListener(type: keyof GameSettings['volume'], callback: (value: number) => void): void {
        this.listeners.get(type)?.add(callback);
    }

    removeVolumeListener(type: keyof GameSettings['volume'], callback: (value: number) => void): void {
        this.listeners.get(type)?.delete(callback);
    }

    private notifyVolumeListeners(type: keyof GameSettings['volume'], value: number): void {
        this.listeners.get(type)?.forEach(callback => {
            try {
                callback(value);
            } catch (err) { // Use different variable name
                error(`Error in volume listener for ${type}:`, err); // Use logger
            }
        });
    }

    // --- Other Settings Getters/Setters ---
    getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] | undefined {
        return this.settings?.[key];
    }

    // Add a specific getter for debug settings if needed often
    getDebugSettings(): GameSettings['debug'] | undefined {
        return this.settings?.debug;
    }

    // Add more specific getters/setters as needed
}
