export const GlobalSettings = {
    gameName: 'Guappo Junior',
    version: '0.8-beta',
    musicEnabled: false,
    updatesEnabled: true,
    
    // Load settings from localStorage
    loadSettings: function() {
        try {
            const saved = localStorage.getItem('guappoSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.musicEnabled = parsed.musicEnabled !== undefined ? parsed.musicEnabled : this.musicEnabled;
                this.updatesEnabled = parsed.updatesEnabled !== undefined ? parsed.updatesEnabled : this.updatesEnabled;
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    },

    // Save settings to localStorage
    saveSettings: function() {
        try {
            const settings = {
                musicEnabled: this.musicEnabled,
                updatesEnabled: this.updatesEnabled
            };
            localStorage.setItem('guappoSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    },

    toggleMusic: function() {
        this.musicEnabled = !this.musicEnabled;
        this.saveSettings();
        return this.musicEnabled;
    },

    toggleUpdates: function() {
        this.updatesEnabled = !this.updatesEnabled;
        this.saveSettings();
        return this.updatesEnabled;
    }
};

// Load settings on module load
GlobalSettings.loadSettings();
