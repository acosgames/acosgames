import {
    btFakePlayers,
    btGamepanels,
    btGameSettings,
    btPrimaryGamePanel,
    btScreenConfig,
    btSocketUser,
} from "../actions/buckets";
import { wsSend } from "../actions/websocket";
import GameStateService from "./GameStateService";

interface GamePanel {
    id: string;
    available: boolean;
    loaded: boolean;
    ready: boolean;
    canvasRef: any;
    gamestate: any;
    gameover: boolean;
    iframe: any;
    active: boolean;
    waitMessages?: any[] | undefined;
    [key: string]: any;
}

const defaultScreenConfig = {
    screentype: 3,
    resow: 4,
    resoh: 4,
    screenwidth: 1024,
};

class GamePanelService {
    constructor() {
        btScreenConfig.set(defaultScreenConfig);
        btPrimaryGamePanel.set(null);
        btGamepanels.set({});

        window.addEventListener("message", this.recvFrameMessage.bind(this), false);
    }

    sendFrameMessage(gamepanel: GamePanel, msg: any): void {
        if (gamepanel?.iframe?.current && gamepanel.ready) {
            gamepanel.iframe.current.contentWindow.postMessage(msg, "*");
        } else {
            gamepanel.waitMessages = gamepanel.waitMessages || [];
            gamepanel.waitMessages.push(msg);
        }
    }

    getFrameByEvent(event: MessageEvent): HTMLIFrameElement | undefined {
        return Array.from(document.getElementsByTagName("iframe")).find(
            (iframe) => iframe.contentWindow === event.source
        );
    }

    getGamePanelByEvent(event: MessageEvent): GamePanel | null {
        const iframe = this.getFrameByEvent(event);
        const gamepanels: Record<string, GamePanel> = btGamepanels.get() || {};
        for (const id in gamepanels) {
            const test = gamepanels[id];
            if (test?.iframe?.current === iframe) return test;
        }
        return null;
    }

    getUserById(id: string): any {
        const fakePlayers: Record<string, any> = btFakePlayers.get() || {};
        let user = btSocketUser.get();
        if (fakePlayers[id]) user = fakePlayers[id];
        return user;
    }

    recvFrameMessage(evt: MessageEvent): void {
        const data = evt.data as any;
        if (data.type === "__ready") return;

        if (data.type === "gamesettings") {
            const gameSettings = data.payload;
            if (gameSettings) {
                const screenConfig = {
                    screentype: gameSettings.screentype,
                    resow: gameSettings.resow,
                    resoh: gameSettings.resoh,
                    screenwidth: gameSettings.screenwidth,
                };
                btScreenConfig.set(screenConfig);
                btGameSettings.set({ ...btGameSettings.get(), ...screenConfig });

                if (Array.isArray(gameSettings.teams) && gameSettings.teams.length > 0) {
                    GameStateService.initTeamsFromSettings(gameSettings.teams);
                }
            }
            return;
        }

        const gamepanel = this.getGamePanelByEvent(evt);
        if (!gamepanel) return;

        const user = this.getUserById(gamepanel.id);
        if (!user) return;

        if (data.type === "ready") {
            console.log(">>>> GAME IS READY");
            gamepanel.ready = true;
            if (gamepanel?.waitMessages && (gamepanel.waitMessages?.length || 0) > 0) {
                for (const waitMessage of gamepanel.waitMessages) {
                    this.sendFrameMessage(gamepanel, waitMessage);
                }
            }
            return;
        } else if (data.type === "loaded") {
            console.log(">>>> GAME IS LOADED");
            gamepanel.ready = true;
            if (gamepanel?.waitMessages && (gamepanel.waitMessages?.length || 0) > 0) {
                for (const waitMessage of gamepanel.waitMessages) {
                    this.sendFrameMessage(gamepanel, waitMessage);
                }
            } else {
                GameStateService.updateGamePanel(gamepanel.id);
            }
            return;
        }

        const gameState = GameStateService.getGameState();
        if (!Array.isArray(gameState?.players) || !gameState.players.some((p: any) => p.shortid === gamepanel.id)) {
            return;
        }

        if (user.shortid !== gamepanel.id) return;

        data.user = { shortid: user.shortid, displayname: user.displayname };
        wsSend("action", data);
    }

    createGamePanel(id: string): GamePanel {
        const gp: GamePanel = {
            id,
            available: false,
            loaded: false,
            ready: false,
            canvasRef: null,
            gamestate: null,
            gameover: false,
            iframe: null,
            active: true,
        };

        const gps: Record<string, GamePanel> = btGamepanels.get() || {};
        gps[id] = gp;
        btGamepanels.set(gps);
        return gp;
    }

    removeAllButUserGamePanel(userid: string): boolean {
        const gps: Record<string, GamePanel> = btGamepanels.get() || {};

        for (const id in gps) {
            if (id === userid) continue;
            const gp = gps[id];
            delete gps[id];
            btGamepanels.set(gps);

            const primary = btPrimaryGamePanel.get();
            if (gp === primary) {
                const keys = Object.keys(gps);
                if (keys.length > 0) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)];
                    btPrimaryGamePanel.set(gps[randomKey]);
                }
            }
        }
        return true;
    }

    removeGamePanel(id: string): boolean {
        const gps: Record<string, GamePanel> = btGamepanels.get() || {};

        if (id in gps) {
            const gp = gps[id];
            delete gps[id];
            btGamepanels.set(gps);

            const primary = btPrimaryGamePanel.get();
            if (gp === primary) {
                const keys = Object.keys(gps);
                if (keys.length > 0) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)];
                    btPrimaryGamePanel.set(gps[randomKey]);
                }
            }
            return true;
        }
        return false;
    }
}

export default new GamePanelService();
