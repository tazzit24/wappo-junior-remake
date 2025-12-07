export const GlobalSettings = {
    gameName: 'Guappo Junior',
    version: 'b.0.7',
    musicEnabled: true,
    updatesEnabled: true,
    
    toggleMusic: function() {
        this.musicEnabled = !this.musicEnabled;
        return this.musicEnabled;
    },

    toggleUpdates: function() {
        this.updatesEnabled = !this.updatesEnabled;
        return this.updatesEnabled;
    }
};
