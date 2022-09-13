// const settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

const path = require('path');
const chokidar = require('chokidar');
const profiler = require('./profiler');
const fs = require('fs');
const defaultGameSettings = { minplayers: 1, maxplayers: 1, minteams: 0, maxteams: 0, teams: [], screentype: 3, resow: 4, resoh: 3, screenwidth: 800 };



class GameSettingsManager {
    constructor(gameWorkingDirectory) {

        this.settingsPath = path.join(gameWorkingDirectory, './game-settings.json');
        this.gameSettings = defaultGameSettings;

        this.loadSettings();
    }


    get() {
        return this.gameSettings;
    }

    validateSettings() {
        let s = this.gameSettings;

        if (!('minplayers' in s) || !Number.isInteger(s.minplayers)) {
            s.minplayers = 1;
        }
        if (!('maxplayers' in s) || !Number.isInteger(s.maxplayers)) {
            s.maxplayers = 1;
        }
        if (!('minteams' in s) || !Number.isInteger(s.minteams)) {
            s.minteams = 0;
        }
        if (!('minplayers' in s) || !Number.isInteger(s.minplayers)) {
            s.minplayers = 0;
        }
        if (!('maxteams' in s) || !Number.isInteger(s.maxteams)) {
            s.maxteams = 0;
        }
        if (!('teams' in s) || !Array.isArray(s.teams)) {
            s.teams = [];
        }
        if (!('screentype' in s) || !Number.isInteger(s.screentype)) {
            s.screentype = 3;
        }
        if (!('resow' in s) || !Number.isInteger(s.resow)) {
            s.resow = 4;
        }
        if (!('resoh' in s) || !Number.isInteger(s.resoh)) {
            s.resoh = 3;
        }
        if (!('screenwidth' in s) || !Number.isInteger(s.screenwidth)) {
            s.screenwidth = 800;
        }

    }

    loadSettings() {
        this.reloadServerGameSettings(this.settingsPath);

        let watchPath = this.settingsPath.substr(0, this.settingsPath.lastIndexOf(path.sep));
        chokidar.watch(this.settingsPath).on('change', (path) => {
            this.reloadServerGameSettings(this.settingsPath);
            console.log(`[ACOS] ${this.settingsPath} file Changed`, watchPath);
        });
    }

    updateGameSettings(newGameSettings) {

        try {
            let jsonStr = JSON.stringify(newGameSettings, null, 4);
            let json = JSON.parse(jsonStr);
            fs.writeFileSync(this.settingsPath, jsonStr, 'utf-8');
        }
        catch (e) {
            console.error("Invalid JSON for updateGameSettings: ", newGameSettings, e);
            return false;
        }
        return true;
    }

    // validate() {
    //     if (typeof this.gameSettings.minplayers !== 'number')
    //         this.gameSettings.minplayers = 1;
    //     if (typeof this.gameSettings.maxplayers !== 'number')
    //         this.gameSettings.maxplayers = 1;
    //     if (typeof this.gameSettings.minteams !== 'number')
    //         this.gameSettings.minteams = 0;
    //     if (typeof this.gameSettings.maxteams !== 'number')
    //         this.gameSettings.maxteams = 0;
    //     if (!Array.isArray(this.gameSettings.teams))
    //         this.gameSettings.teams = [];

    // }
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

        this.validateSettings();

        return this.gameSettings;
    }

}




module.exports = GameSettingsManager;