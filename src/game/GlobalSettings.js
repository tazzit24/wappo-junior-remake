export const GlobalSettings = {
    gameName: 'Guappo Junior',
    version: '0.10-beta',
    musicEnabled: false,
    updatesEnabled: true,
    wakeLockEnabled: true,
    difficulty: 'easy', // 'easy' or 'normal'
    
    // Load settings from localStorage
    loadSettings: function() {
        try {
            const saved = localStorage.getItem('guappoSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.musicEnabled = parsed.musicEnabled !== undefined ? parsed.musicEnabled : this.musicEnabled;
                this.updatesEnabled = parsed.updatesEnabled !== undefined ? parsed.updatesEnabled : this.updatesEnabled;
                this.wakeLockEnabled = parsed.wakeLockEnabled !== undefined ? parsed.wakeLockEnabled : this.wakeLockEnabled;
                this.difficulty = parsed.difficulty !== undefined ? parsed.difficulty : this.difficulty;
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
                updatesEnabled: this.updatesEnabled,
                wakeLockEnabled: this.wakeLockEnabled,
                difficulty: this.difficulty
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
    },

    toggleWakeLock: function() {
        this.wakeLockEnabled = !this.wakeLockEnabled;
        this.saveSettings();
        return this.wakeLockEnabled;
    },

    toggleDifficulty: function() {
        this.difficulty = this.difficulty === 'easy' ? 'normal' : 'easy';
        this.saveSettings();
        return this.difficulty;
    }
};

// Load settings on module load
GlobalSettings.loadSettings();
