export var EGameStatus;
(function (EGameStatus) {
    EGameStatus[EGameStatus["none"] = 0] = "none";
    EGameStatus[EGameStatus["waiting"] = 1] = "waiting";
    EGameStatus[EGameStatus["pregame"] = 2] = "pregame";
    EGameStatus[EGameStatus["starting"] = 3] = "starting";
    EGameStatus[EGameStatus["gamestart"] = 4] = "gamestart";
    EGameStatus[EGameStatus["gameover"] = 5] = "gameover";
    EGameStatus[EGameStatus["gamecancelled"] = 6] = "gamecancelled";
    EGameStatus[EGameStatus["gameerror"] = 7] = "gameerror";
})(EGameStatus || (EGameStatus = {}));
