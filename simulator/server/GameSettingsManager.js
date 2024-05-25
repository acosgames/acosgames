// const settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

const path = require("path");
const chokidar = require("chokidar");
const profiler = require("./profiler");
const fs = require("fs");
const defaultGameSettings = {
    minplayers: 1,
    maxplayers: 1,
    minteams: 0,
    maxteams: 0,
    teams: [],
    screentype: 3,
    resow: 4,
    resoh: 3,
    screenwidth: 800,
};

class GameSettingsManager {
    constructor(gameWorkingDirectory, callback) {
        this.gameSettings = null;
    }

    start(gameWorkingDirectory, callback) {
        if (!gameWorkingDirectory) return;
        this.onGameSettingsReloaded = callback;
        this.settingsPath = path.join(
            gameWorkingDirectory,
            "./game-settings.json"
        );
        this.gameSettings = defaultGameSettings;

        this.loadSettings();
    }

    get() {
        return this.gameSettings;
    }

    arraymove = (arr, fromIndex, toIndex) => {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    };

    validateSettings() {
        let s = this.gameSettings;

        let dirty = false;

        if (!("minplayers" in s) || !Number.isInteger(s.minplayers)) {
            s.minplayers = 1;
            dirty = true;
        }
        // else if (s.minplayers > s.maxplayers) {
        //     s.minplayers = s.maxplayers;
        //     dirty = true;
        // }
        else if (s.minplayers < 0) {
            s.minplayers = 0;
            dirty = true;
        }
        if (!("maxplayers" in s) || !Number.isInteger(s.maxplayers)) {
            s.maxplayers = 1;
            dirty = true;
        } else if (s.maxplayers < s.minplayers) {
            s.maxplayers = s.minplayers;
            dirty = true;
        } else if (s.maxplayers < 0) {
            s.maxplayers = 0;
            dirty = true;
        }

        if (!("minteams" in s) || !Number.isInteger(s.minteams)) {
            s.minteams = 0;
            dirty = true;
        }
        // else if (s.minteams > s.maxteams) {
        //     s.minteams = s.maxteams;
        //     dirty = true;
        // }
        else if (s.minteams < 0) {
            s.minteams = 0;
            dirty = true;
        }

        if (!("maxteams" in s) || !Number.isInteger(s.maxteams)) {
            s.maxteams = 0;
            dirty = true;
        } else if (s.maxteams < s.minteams) {
            s.maxteams = s.minteams;
            dirty = true;
        } else if (s.maxteams < 0) {
            s.maxteams = 0;
            dirty = true;
        }

        if (!("teams" in s) || !Array.isArray(s.teams)) {
            s.teams = [];
            dirty = true;
        }
        if (s.maxteams > 0 && s.teams.length < s.maxteams) {
            let missingCount = s.maxteams - s.teams.length;
            for (let i = 0; i < missingCount; i++) {
                s.teams.push({
                    team_name: "Team " + (s.teams.length + i + 1),
                    team_slug: "team_" + (s.teams.length + i + 1),
                    minplayers: 1,
                    maxplayers: 1,
                    team_order: s.teams.length,
                    color: "#000000",
                });
                dirty = true;
            }
            console.log("added missing teams: ", missingCount);
        }
        if (s.teams.length > s.maxteams) {
            let overCount = s.teams.length - s.maxteams;
            for (let i = 0; i < overCount; i++) {
                s.teams.pop();
                dirty = true;
            }
            console.log("removed overflow teams: ", overCount);
        }

        let teamMaxPlayers = 0;

        if ("stats" in s) {
            for (let stat of s.stats) {
                let prev = stat.valueTYPE;
                try {
                    stat.valueTYPE = Number.parseInt(stat.valueTYPE);
                } catch (e) {
                    stat.valueTYPE = 0;
                }
                if (prev != stat.valueTYPE) dirty = true;

                if (!stat.stat_desc) {
                    stat.stat_desc = "";
                    dirty = true;
                }
            }

            s.stats.sort((a, b) => {
                return a.stat_order - b.stat_order;
            });
        }

        if ("items" in s) {
            for (let item of s.items) {
                let prevUses = item.max_uses;
                let prevExpire = item.expire_days;
                try {
                    item.max_uses = Number.parseInt(item.max_uses);
                } catch (e) {
                    item.max_uses = 0;
                }
                try {
                    item.expire_days = Number.parseInt(item.expire_days);
                } catch (e) {
                    item.expire_days = 0;
                }
                if (prevUses != item.max_uses) dirty = true;
                if (prevExpire != item.expire_days) dirty = true;

                if (!item.item_desc) {
                    item.item_desc = "";
                    dirty = true;
                }
            }

            s.items.sort((a, b) => {
                return a.item_order - b.item_order;
            });
        }
        if ("teams" in s) {
            if (s.teams.length > 0) {
                for (let team of s.teams) {
                    if (
                        !("minplayers" in team) ||
                        !Number.isInteger(team.minplayers)
                    ) {
                        team.minplayers = 1;
                        dirty = true;
                    } else if (team.minplayers < 0) {
                        team.minplayers = 0;
                        dirty = true;
                    }
                    if (
                        !("maxplayers" in team) ||
                        !Number.isInteger(team.maxplayers)
                    ) {
                        team.maxplayers = 1;
                        dirty = true;
                    } else if (team.maxplayers < team.minplayers) {
                        team.maxplayers = team.minplayers;
                        dirty = true;
                    } else if (team.maxplayers < 0) {
                        team.maxplayers = 0;
                        dirty = true;
                    }

                    teamMaxPlayers += team.maxplayers;
                }
            }
            if (s.teams.length > 1) {
                if (s.maxplayers != teamMaxPlayers) {
                    s.maxplayers = teamMaxPlayers;
                    dirty = true;
                }
            }

            s.teams.sort((a, b) => {
                return a.team_order - b.team_order;
            });
        }

        if (!("screentype" in s) || !Number.isInteger(s.screentype)) {
            s.screentype = 3;
            dirty = true;
        }
        if (!("resow" in s) || !Number.isInteger(s.resow)) {
            s.resow = 4;
            dirty = true;
        }
        if (!("resoh" in s) || !Number.isInteger(s.resoh)) {
            s.resoh = 3;
            dirty = true;
        }
        if (!("screenwidth" in s) || !Number.isInteger(s.screenwidth)) {
            s.screenwidth = 800;
            dirty = true;
        }

        if (dirty) {
            this.updateGameSettings(s);
            return false;
        }

        return true;
    }

    loadSettings() {
        this.reloadServerGameSettings(this.settingsPath);

        let watchPath = this.settingsPath.substr(
            0,
            this.settingsPath.lastIndexOf(path.sep)
        );
        chokidar.watch(this.settingsPath).on("change", (path) => {
            let s = this.reloadServerGameSettings(this.settingsPath);
            if (s) this.onGameSettingsReloaded();
            console.log(`[ACOS] ${this.settingsPath} file Changed`, watchPath);
        });
    }

    updateGameSettings(newGameSettings) {
        try {
            let jsonStr = JSON.stringify(newGameSettings, null, 4);
            let json = JSON.parse(jsonStr);
            fs.writeFileSync(this.settingsPath, jsonStr, "utf-8");

            // this.validateSettings();
        } catch (e) {
            console.error(
                "Invalid JSON for updateGameSettings: ",
                newGameSettings,
                e
            );
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
    reloadServerGameSettings(filepath) {
        profiler.Start("Reloaded Game Settings in");
        {
            try {
                var data = fs.readFileSync(filepath, "utf8");
                this.gameSettings = JSON.parse(data);
            } catch (e) {
                this.gameSettings = defaultGameSettings;
                console.warn(
                    "[WARNING] Failed to load Game settings, switching to default game settings: ",
                    e
                );
            }
        }
        profiler.End("Reloaded Game Settings in");

        let filename = filepath.split(/\/|\\/gi);
        filename = filename[filename.length - 1];
        // console.log("[ACOS] Game Settings Reloaded: " + filename);

        this.validateSettings();

        return this.gameSettings;
    }
}

module.exports = new GameSettingsManager();
