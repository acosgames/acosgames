import { bucket } from "react-bucketjs";

export const btTimeleft = bucket(0);
export const btTimeleftUpdated = bucket(0);

export const btGameStatus = bucket("none");
export const btWebsocketStatus = bucket("none");
export const btReplayStats = bucket({ position: 0, total: 0 });
export const btTeamInfo = bucket([]);

export const btFakePlayers = bucket({});
export const btSocket = bucket(null);

export const btLatencyInfo = bucket({
    latency: 0,
    latencyStart: 0,
    latencyOffsetTime: 0,
});
export const btPrevGameSettings = bucket({});

export const btGameSettings = bucket({});
export const btLocalGameSettings = bucket({});

export const btUsername = bucket("");
export const btSocketUser = bucket({});
export const btAutoJoin = bucket(false);

export const btGamepanelLayout = bucket("compact");
export const btGameState = bucket({});
export const btIsMobile = bucket(false);
export const btIFrameRoute = bucket("//localhost:3100/iframe.html");

export const btIFrames = bucket({});
export const btIFramesLoaded = bucket({});
export const btDisplayMode = bucket("none");
export const btIFrameStyle = bucket("");
export const btIsFullScreen = bucket(false);
export const btFullScreenElement = bucket(null);
export const btPrimaryGamePanel = bucket(null);
export const btGamepanels = bucket(null);
export const btTeamSettings = bucket([]);
export const btTeamSettingsRef = bucket(null);
export const btActionToggle = bucket(true);
export const btPrimaryCanvasRef = bucket(null);
export const btMainPageRef = bucket(null);
export const btScoreboardExpanded = bucket(null);
export const btViewerAccordianIndex = bucket([0, 1, 2]);
export const btScreenConfig = bucket({
    screentype: 3,
    resow: 4,
    resoh: 4,
    screenwidth: 1024,
});

export const btDeltaState = bucket({});
export const btHiddenPlayerState = bucket({});
export const btDeltaEncoded = bucket(0);

export const btPlayerTeams = bucket(null);
