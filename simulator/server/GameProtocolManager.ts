import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { registerExtension, applyExtension } from "acos-json-encoder";

const GAME_BASE_PROTOCOL = "gameupdate";
const GAME_EXTENSION_NAME = "game";
const ACTION_BASE_PROTOCOL = "action";
const ACTION_EXTENSION_NAME = "gameAction";

class GameProtocolManager {
    private gameProtocol: Record<string, unknown> | null;
    private actionProtocol: Record<string, unknown> | null;
    private gameProtocolPath: string | null;
    private actionProtocolPath: string | null;
    private onProtocolReloaded: (() => void) | null;

    constructor() {
        this.gameProtocol = null;
        this.actionProtocol = null;
        this.gameProtocolPath = null;
        this.actionProtocolPath = null;
        this.onProtocolReloaded = null;
    }

    start(gameWorkingDirectory: string, callback: () => void): void {
        if (!gameWorkingDirectory) return;
        this.onProtocolReloaded = callback;
        this.gameProtocolPath = path.join(gameWorkingDirectory, "./game-protocol.json");
        this.actionProtocolPath = path.join(gameWorkingDirectory, "./action-protocol.json");

        this.reloadGameProtocol(this.gameProtocolPath);
        this.reloadActionProtocol(this.actionProtocolPath);

        chokidar.watch(this.gameProtocolPath).on("change", () => {
            this.reloadGameProtocol(this.gameProtocolPath!);
            if (this.onProtocolReloaded) this.onProtocolReloaded();
            console.log(`[ACOS] ${this.gameProtocolPath} file Changed`);
        });

        chokidar.watch(this.actionProtocolPath).on("change", () => {
            this.reloadActionProtocol(this.actionProtocolPath!);
            if (this.onProtocolReloaded) this.onProtocolReloaded();
            console.log(`[ACOS] ${this.actionProtocolPath} file Changed`);
        });
    }

    get(): Record<string, unknown> | null {
        return this.gameProtocol;
    }

    getActionProtocol(): Record<string, unknown> | null {
        return this.actionProtocol;
    }

    setGameProtocol(protocol: Record<string, unknown>): void {  
        this.gameProtocol = protocol;
        registerExtension(GAME_BASE_PROTOCOL, GAME_EXTENSION_NAME, { payload: this.gameProtocol });
        applyExtension(GAME_BASE_PROTOCOL, GAME_EXTENSION_NAME);
    }

    setActionProtocol(protocol: Record<string, unknown>): void {
        this.actionProtocol = protocol;
        registerExtension(ACTION_BASE_PROTOCOL, ACTION_EXTENSION_NAME, { payload: this.actionProtocol });
        applyExtension(ACTION_BASE_PROTOCOL, ACTION_EXTENSION_NAME);
    }

    reloadGameProtocol(filepath: string): Record<string, unknown> | null {
        try {
            const data = fs.readFileSync(filepath, "utf8");
            const parsed = JSON.parse(data);
            this.setGameProtocol(parsed);

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

    reloadActionProtocol(filepath: string): Record<string, unknown> | null {
        try {
            const data = fs.readFileSync(filepath, "utf8");
            const parsed = JSON.parse(data);
            this.setActionProtocol(parsed);

            const parts = filepath.split(/\/|\\/g);
            const filename = parts[parts.length - 1];
            console.log("[ACOS] Action Protocol loaded: " + filename);
            return this.actionProtocol;
        } catch (e: any) {
            if (e.code !== "ENOENT") {
                console.warn("[WARNING] Failed to load action-protocol.json: ", e);
            }
            return null;
        }
    }
}

export default new GameProtocolManager();
