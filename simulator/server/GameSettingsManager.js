// const settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

const path = require('path');

const defaultGameSettings = { minplayers: 1, maxplayers: 1, minteams: 0, maxteams: 0, teams: [] };



class GameSettingsManager {
    constructor(gameWorkingDirectory) {

        this.settingsPath = path.join(gameWorkingDirectory, './game-settings.json');
        this.gameSettings = defaultGameSettings;
    }


    get() {
        return this.gameSettings;
    }

    loadSettings() {
        reloadServerGameSettings();

        let watchPath = this.settingsPath.substr(0, this.settingsPath.lastIndexOf(path.sep));
        chokidar.watch(watchPath).on('change', (path) => {
            reloadServerGameSettings(this.settingsPath);
            console.log(`[ACOS] ${this.settingsPath} file Changed`, watchPath);
        });
    }

    validate() {
        if (typeof this.gameSettings.minplayers !== 'number')
            this.gameSettings.minplayers = 1;
        if (typeof this.gameSettings.maxplayers !== 'number')
            this.gameSettings.maxplayers = 1;
        if (typeof this.gameSettings.minteams !== 'number')
            this.gameSettings.minteams = 0;
        if (typeof this.gameSettings.maxteams !== 'number')
            this.gameSettings.maxteams = 0;
        if (!Array.isArray(this.gameSettings.teams))
            this.gameSettings.teams = [];

    }
    async reloadServerGameSettings(filepath) {
        profiler.Start('Reloaded Game Settings in');
        {
            var data = fs.readFileSync(filepath, 'utf8');
            try {
                this.gameSettings = JSON.parse(data);
            }
            catch (e) {
                this.gameSettings = defaultGameSettings;
                console.warn("[WARNING] Failed to load Game settings, switching to default game settings: ", e);
            }
        }
        profiler.End('Reloaded Game Settings in');

        let filename = filepath.split(/\/|\\/ig);
        filename = filename[filename.length - 1];
        // console.log("[ACOS] Game Settings Reloaded: " + filename);

        this.validate();

        return this.gameSettings;
    }

}




module.exports = GameSettingsManager;