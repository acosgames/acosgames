import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import Profiler from "./profiler";

interface TeamSetting {
    team_name: string;
    team_slug: string;
    minplayers: number;
    maxplayers: number;
    team_order: number;
    color: string;
}

interface StatSetting {
    valueTYPE: number;
    stat_desc: string;
    [key: string]: unknown;
}

interface ItemSetting {
    max_uses: number;
    expire_days: number;
    item_desc: string;
    item_order: number;
    [key: string]: unknown;
}

export interface GameSettings {
    minplayers: number;
    maxplayers: number;
    minteams: number;
    maxteams: number;
    teams: TeamSetting[];
    screentype: number;
    resow: number;
    resoh: number;
    screenwidth: number;
    stats?: Record<string, StatSetting>;
    items?: ItemSetting[];
    [key: string]: unknown;
}

const defaultGameSettings: GameSettings = {
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
    private gameSettings: GameSettings | null;
    private settingsPath: string;
    private onGameSettingsReloaded: (() => void) | null;

    constructor() {
        this.gameSettings = null;
        this.settingsPath = "";
        this.onGameSettingsReloaded = null;
    }

    start(gameWorkingDirectory: string, callback: () => void): void {
        if (!gameWorkingDirectory) return;
        this.onGameSettingsReloaded = callback;
        this.settingsPath = path.join(gameWorkingDirectory, "./game-settings.json");
        this.gameSettings = defaultGameSettings;
        this.loadSettings();
    }

    get(): GameSettings {
        return this.gameSettings!;
    }

    private arraymove<T>(arr: T[], fromIndex: number, toIndex: number): void {
        const element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }

    validateSettings(): boolean {
        const s = this.gameSettings!;
        let dirty = false;

        if (!("minplayers" in s) || !Number.isInteger(s.minplayers)) {
            s.minplayers = 1; dirty = true;
        } else if (s.minplayers < 0) {
            s.minplayers = 0; dirty = true;
        }

        if (!("maxplayers" in s) || !Number.isInteger(s.maxplayers)) {
            s.maxplayers = 1; dirty = true;
        } else if (s.maxplayers < s.minplayers) {
            s.maxplayers = s.minplayers; dirty = true;
        } else if (s.maxplayers < 0) {
            s.maxplayers = 0; dirty = true;
        }

        if (!("minteams" in s) || !Number.isInteger(s.minteams)) {
            s.minteams = 0; dirty = true;
        } else if (s.minteams < 0) {
            s.minteams = 0; dirty = true;
        }

        if (!("maxteams" in s) || !Number.isInteger(s.maxteams)) {
            s.maxteams = 0; dirty = true;
        } else if (s.maxteams < s.minteams) {
            s.maxteams = s.minteams; dirty = true;
        } else if (s.maxteams < 0) {
            s.maxteams = 0; dirty = true;
        }

        if (!("teams" in s) || !Array.isArray(s.teams)) {
            s.teams = []; dirty = true;
        }

        if (s.maxteams > 0 && s.teams.length < s.maxteams) {
            const missingCount = s.maxteams - s.teams.length;
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
            const overCount = s.teams.length - s.maxteams;
            for (let i = 0; i < overCount; i++) {
                s.teams.pop();
                dirty = true;
            }
            console.log("removed overflow teams: ", overCount);
        }

        let teamMaxPlayers = 0;

        if ("stats" in s) {
            for (const abbr in s.stats) {
                const stat = s.stats![abbr];
                const prev = stat.valueTYPE;
                try { stat.valueTYPE = Number.parseInt(String(stat.valueTYPE)); } catch { stat.valueTYPE = 0; }
                if (prev !== stat.valueTYPE) dirty = true;
                if (!stat.stat_desc) { stat.stat_desc = ""; dirty = true; }
            }
        } else {
            s.stats = {}; dirty = true;
        }

        if ("items" in s && Array.isArray(s.items)) {
            for (const item of s.items!) {
                const prevUses = item.max_uses;
                const prevExpire = item.expire_days;
                try { item.max_uses = Number.parseInt(String(item.max_uses)); } catch { item.max_uses = 0; }
                try { item.expire_days = Number.parseInt(String(item.expire_days)); } catch { item.expire_days = 0; }
                if (prevUses !== item.max_uses) dirty = true;
                if (prevExpire !== item.expire_days) dirty = true;
                if (!item.item_desc) { item.item_desc = ""; dirty = true; }
            }
            s.items!.sort((a, b) => a.item_order - b.item_order);
        }

        if ("teams" in s && s.teams.length > 0) {
            for (const team of s.teams) {
                if (!("minplayers" in team) || !Number.isInteger(team.minplayers)) {
                    team.minplayers = 1; dirty = true;
                } else if (team.minplayers < 0) {
                    team.minplayers = 0; dirty = true;
                }
                if (!("maxplayers" in team) || !Number.isInteger(team.maxplayers)) {
                    team.maxplayers = 1; dirty = true;
                } else if (team.maxplayers < team.minplayers) {
                    team.maxplayers = team.minplayers; dirty = true;
                } else if (team.maxplayers < 0) {
                    team.maxplayers = 0; dirty = true;
                }
                teamMaxPlayers += team.maxplayers;
            }

            if (s.teams.length > 1 && s.maxplayers !== teamMaxPlayers) {
                s.maxplayers = teamMaxPlayers; dirty = true;
            }

            s.teams.sort((a, b) => a.team_order - b.team_order);
        }

        if (!("screentype" in s) || !Number.isInteger(s.screentype)) { s.screentype = 3; dirty = true; }
        if (!("resow" in s) || !Number.isInteger(s.resow)) { s.resow = 4; dirty = true; }
        if (!("resoh" in s) || !Number.isInteger(s.resoh)) { s.resoh = 3; dirty = true; }
        if (!("screenwidth" in s) || !Number.isInteger(s.screenwidth)) { s.screenwidth = 800; dirty = true; }

        if (dirty) {
            this.updateGameSettings(s);
            return false;
        }
        return true;
    }

    loadSettings(): void {
        this.reloadServerGameSettings(this.settingsPath);

        chokidar.watch(this.settingsPath).on("change", () => {
            const s = this.reloadServerGameSettings(this.settingsPath);
            if (s && this.onGameSettingsReloaded) this.onGameSettingsReloaded();
            console.log(`[ACOS] ${this.settingsPath} file Changed`);
        });
    }

    updateGameSettings(newGameSettings: GameSettings): boolean {
        try {
            const jsonStr = JSON.stringify(newGameSettings, null, 4);
            JSON.parse(jsonStr); // validate
            fs.writeFileSync(this.settingsPath, jsonStr, "utf-8");
        } catch (e) {
            console.error("Invalid JSON for updateGameSettings: ", newGameSettings, e);
            return false;
        }
        return true;
    }

    reloadServerGameSettings(filepath: string): GameSettings | null {
        Profiler.Start("Reloaded Game Settings in");
        try {
            const data = fs.readFileSync(filepath, "utf8");
            this.gameSettings = JSON.parse(data) as GameSettings;
        } catch (e) {
            this.gameSettings = { ...defaultGameSettings };
            console.warn(
                "[WARNING] Failed to load Game settings, switching to default game settings: ",
                e
            );
        }
        Profiler.End("Reloaded Game Settings in");

        const parts = filepath.split(/\/|\\/gi);
        const filename = parts[parts.length - 1];

        this.validateSettings();
        return this.gameSettings;
    }
}

export default new GameSettingsManager();
