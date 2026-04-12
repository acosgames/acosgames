import Room from "./Room";
import GameSettingsManager from "./GameSettingsManager";

class RoomManager {
    private settings: typeof GameSettingsManager;
    private room: Room;

    constructor() {
        this.settings = GameSettingsManager;
        this.room = new Room(this.settings);
    }

    setSettings(settings: typeof GameSettingsManager): void {
        this.settings = settings;
    }

    create(): Room {
        this.room = new Room(this.settings);
        return this.room;
    }

    gameover(): Room | null {
        const room = this.current();
        if (!room) return null;
        (room as any).roomstatus = "gameover";
        return room;
    }

    update(gamestate: any): Room | null {
        const room = this.current();
        if (!room) return null;
        (room as any).update(gamestate);
        return room;
    }

    gamestate(room?: Room): any {
        return room ? room.getGameState() : this.current().getGameState();
    }

    current(): Room {
        if (this.room) {
            return this.room;
        }
        return this.create();
    }
}

export default RoomManager;
