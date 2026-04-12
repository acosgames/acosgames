const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const { registerExtension, applyExtension } = require("acos-json-encoder");

const BASE_PROTOCOL = "gameupdate";
const EXTENSION_NAME = "game";

class GameProtocolManager {
    constructor() {
        this.gameProtocol = null;
        this.protocolPath = null;
        this.onProtocolReloaded = null;
    }

    start(gameWorkingDirectory, callback) {
        if (!gameWorkingDirectory) return;
        this.onProtocolReloaded = callback;
        this.protocolPath = path.join(gameWorkingDirectory, "./game-protocol.json");

        this.reloadProtocol(this.protocolPath);

        chokidar.watch(this.protocolPath).on("change", () => {
            this.reloadProtocol(this.protocolPath);
            if (this.onProtocolReloaded) this.onProtocolReloaded();
            console.log(`[ACOS] ${this.protocolPath} file Changed`);
        });
    }

    get() {
        return this.gameProtocol;
    }

    reloadProtocol(filepath) {
        try {
            let data = fs.readFileSync(filepath, "utf8");
            this.gameProtocol = JSON.parse(data);

            // game-protocol.json defines payload-level overrides (state, players, teams)
            // so wrap in { payload: ... } to match the protocol message structure
            registerExtension(BASE_PROTOCOL, EXTENSION_NAME, { payload: this.gameProtocol });
            applyExtension(BASE_PROTOCOL, EXTENSION_NAME);

            let filename = filepath.split(/\/|\\/g);
            filename = filename[filename.length - 1];
            console.log("[ACOS] Game Protocol loaded: " + filename);
            return this.gameProtocol;
        } catch (e) {
            if (e.code !== "ENOENT") {
                console.warn("[WARNING] Failed to load game-protocol.json: ", e);
            }
            return null;
        }
    }
}

module.exports = new GameProtocolManager();
