import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { registerExtension, applyExtension } from "acos-json-encoder";

const BASE_PROTOCOL = "gameupdate";
const EXTENSION_NAME = "game";

class GameProtocolManager {
    private gameProtocol: Record<string, unknown> | null;
    private protocolPath: string | null;
    private onProtocolReloaded: (() => void) | null;

    constructor() {
        this.gameProtocol = null;
        this.protocolPath = null;
        this.onProtocolReloaded = null;
    }

    start(gameWorkingDirectory: string, callback: () => void): void {
        if (!gameWorkingDirectory) return;
        this.onProtocolReloaded = callback;
        this.protocolPath = path.join(gameWorkingDirectory, "./game-protocol.json");

        this.reloadProtocol(this.protocolPath);

        chokidar.watch(this.protocolPath).on("change", () => {
            this.reloadProtocol(this.protocolPath!);
            if (this.onProtocolReloaded) this.onProtocolReloaded();
            console.log(`[ACOS] ${this.protocolPath} file Changed`);
        });
    }

    get(): Record<string, unknown> | null {
        return this.gameProtocol;
    }

    reloadProtocol(filepath: string): Record<string, unknown> | null {
        try {
            const data = fs.readFileSync(filepath, "utf8");
            this.gameProtocol = JSON.parse(data);

            registerExtension(BASE_PROTOCOL, EXTENSION_NAME, { payload: this.gameProtocol });
            applyExtension(BASE_PROTOCOL, EXTENSION_NAME);

            const parts = filepath.split(/\/|\\/g);
            const filename = parts[parts.length - 1];
            console.log("[ACOS] Game Protocol loaded: " + filename);
            return this.gameProtocol;
        } catch (e: any) {
            if (e.code !== "ENOENT") {
                console.warn("[WARNING] Failed to load game-protocol.json: ", e);
            }
            return null;
        }
    }
}

export default new GameProtocolManager();
