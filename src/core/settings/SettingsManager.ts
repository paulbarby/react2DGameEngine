interface GameSettings {
    volume: {
        master: number;
        music: number;
        sfx: number;
    };
    controls: {
        invertY: boolean;
    };
    // Add other settings categories as needed
}

export class SettingsManager {
    private settings: GameSettings | null = null;
    private settingsUrl: string;
    private listeners: Map<keyof GameSettings['volume'], Set<(value: number) => void>> = new Map();

    constructor(settingsUrl: string = '/config/settings.json') {
        this.settingsUrl = settingsUrl;
        // Initialize listener sets
        this.listeners.set('master', new Set());
        this.listeners.set('music', new Set());
        this.listeners.set('sfx', new Set());
    }

    // Make loadSettings return the settings object or null
    async loadSettings(): Promise<GameSettings | null> {
        try {
            console.log("SettingsManager: Starting fetch for settings...");
            const response = await fetch(this.settingsUrl);
            console.log(`SettingsManager: Fetch response status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.statusText}`);
            }
            const loadedData = await response.json();
            console.log("SettingsManager: JSON parsed:", loadedData);

            // Basic validation
            if (!loadedData?.volume || typeof loadedData.volume.master !== 'number') {
                 console.error("Loaded settings missing 'volume' property or master volume is not a number.");
                 throw new Error("Invalid settings format");
            }

            this.settings = loadedData as GameSettings; // Assign validated data
            console.log('SettingsManager: Settings assigned successfully:', this.settings);

            // --- REMOVE NOTIFY LISTENERS FROM HERE ---
            // Listeners will be notified only when setXxxVolume is called later.
            // Initial values are read directly by consumers after loadSettings completes.
            // this.notifyVolumeListeners('master', this.getMasterVolume());
            // this.notifyVolumeListeners('music', this.getMusicVolumeMultiplier());
            // this.notifyVolumeListeners('sfx', this.getSfxVolumeMultiplier());
            // --- END REMOVAL ---

            return this.settings; // Return the loaded settings
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            console.warn('Using default settings due to loading error.');

            // --- REMOVE NOTIFY LISTENERS FROM HERE (Error Case) ---
            // this.notifyVolumeListeners('master', this.getMasterVolume());
            // this.notifyVolumeListeners('music', this.getMusicVolumeMultiplier());
            // this.notifyVolumeListeners('sfx', this.getSfxVolumeMultiplier());
            // --- END REMOVAL ---

            return this.settings; // Return default settings on error
        }
    }

    private getDefaultSettings(): GameSettings {
        console.log("SettingsManager: Returning DEFAULT settings object."); // Log when defaults are used
        // Define hardcoded defaults in case loading fails
        return {
            volume: { master: 0.8, music: 1.0, sfx: 1.0 },
            controls: { invertY: false }
        };
    }

    // --- Volume Getters ---
    getMasterVolume(): number {
        console.log('Getter this.settings:', this.settings); // <<< ADD THIS LOG
        console.log('Getter this.settings.volume:', this.settings?.volume); // <<< ADD THIS LOG
        const settingsAvailable = !!this.settings;
        const masterValue = this.settings?.volume?.master;
        const defaultValue = this.getDefaultSettings().volume.master;
        const result = masterValue ?? defaultValue;
        console.log(`SettingsManager.getMasterVolume(): Settings available=${settingsAvailable}, Value=${masterValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    getMusicVolumeMultiplier(): number {
        console.log('Getter this.settings.volume:', this.settings?.volume); // <<< ADD THIS LOG
        const settingsAvailable = !!this.settings;
        const musicValue = this.settings?.volume?.music;
        const defaultValue = this.getDefaultSettings().volume.music;
        const result = musicValue ?? defaultValue;
        console.log(`SettingsManager.getMusicVolumeMultiplier(): Settings available=${settingsAvailable}, Value=${musicValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    getSfxVolumeMultiplier(): number {
        console.log('Getter this.settings.volume:', this.settings?.volume); // <<< ADD THIS LOG
        const settingsAvailable = !!this.settings;
        const sfxValue = this.settings?.volume?.sfx;
        const defaultValue = this.getDefaultSettings().volume.sfx;
        const result = sfxValue ?? defaultValue;
        console.log(`SettingsManager.getSfxVolumeMultiplier(): Settings available=${settingsAvailable}, Value=${sfxValue}, Default=${defaultValue}, Result=${result}`);
        return result;
    }

    // --- Volume Setters ---
    setMasterVolume(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0 && value <= 1) {
            const clampedValue = Math.max(0, Math.min(1, value));
            if (this.settings.volume.master !== clampedValue) {
                this.settings.volume.master = clampedValue;
                console.log(`SettingsManager: Master Volume set to ${clampedValue}`);
                this.notifyVolumeListeners('master', clampedValue);
                // TODO: Persist settings (e.g., localStorage)
            }
        } else {
            console.warn(`Invalid value provided for master volume: ${value}`);
        }
    }

    setMusicVolumeMultiplier(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0) { // Allow > 1? Usually 0-1.
            const clampedValue = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
            if (this.settings.volume.music !== clampedValue) {
                this.settings.volume.music = clampedValue;
                console.log(`SettingsManager: Music Volume Multiplier set to ${clampedValue}`);
                this.notifyVolumeListeners('music', clampedValue);
                // TODO: Persist settings
            }
        } else {
            console.warn(`Invalid value provided for music volume multiplier: ${value}`);
        }
    }

    setSfxVolumeMultiplier(value: number): void {
        if (this.settings && typeof value === 'number' && value >= 0) { // Allow > 1? Usually 0-1.
             const clampedValue = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
            if (this.settings.volume.sfx !== clampedValue) {
                this.settings.volume.sfx = clampedValue;
                console.log(`SettingsManager: SFX Volume Multiplier set to ${clampedValue}`);
                this.notifyVolumeListeners('sfx', clampedValue);
                // TODO: Persist settings
            }
        } else {
            console.warn(`Invalid value provided for sfx volume multiplier: ${value}`);
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
            } catch (error) {
                console.error(`Error in volume listener for ${type}:`, error);
            }
        });
    }

    // --- Other Settings Getters/Setters ---
    getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] | undefined {
        return this.settings?.[key];
    }

    // Add more specific getters/setters as needed
}
