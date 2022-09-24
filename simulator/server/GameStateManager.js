// const settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

const profiler = require('./profiler');
const fs = require('fs');


class GameStateManager {

    constructor() {
        this.history = [];
        this.current = 0;
    }

}

export default GameStateManager;