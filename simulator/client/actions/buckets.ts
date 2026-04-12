import { bucket } from "react-bucketjs";

export const btTimeleft = bucket<number>(0);
export const btTimeleftUpdated = bucket<number>(0);

export const btGameStatus = bucket<number>(0);
export const btWebsocketStatus = bucket<string>("none");
export const btReplayStats = bucket<{ position: number; total: number }>({ position: 0, total: 0 });
export const btTeamInfo = bucket<any[]>([]);

export const btFakePlayers = bucket<Record<string, any>>({});
export const btSocket = bucket<any>(null);

export const btLatencyInfo = bucket<{
    serverOffset: number;
    serverTime: number;
    currentTime: number;
    realTime: number;
    latency: number;
    latencyStart: number;
    latencyOffsetTime: number;
}>({
    serverOffset: 0,
    serverTime: 0,
    currentTime: 0,
    realTime: 0,
    latency: 0,
    latencyStart: 0,
    latencyOffsetTime: 0,
});
export const btPrevGameSettings = bucket<Record<string, any>>({});

export const btGameSettings = bucket<Record<string, any>>({});
export const btLocalGameSettings = bucket<Record<string, any>>({});

export const btUsername = bucket<string>("");
export const btSocketUser = bucket<Record<string, any>>({});
export const btAutoJoin = bucket<boolean>(true);

export const btGamepanelLayout = bucket<string>("compact");
export const btGameState = bucket<Record<string, any>>({});
export const btIsMobile = bucket<boolean>(false);
export const btIFrameRoute = bucket<string>("//localhost:3100/iframe.html");

export const btIFrames = bucket<Record<string, any>>({});
export const btIFramesLoaded = bucket<Record<string, any>>({});
export const btDisplayMode = bucket<string>("none");
export const btIFrameStyle = bucket<CSSStyleDeclaration>({} as CSSStyleDeclaration);
export const btIsFullScreen = bucket<boolean>(false);
export const btFullScreenElement = bucket<any>(null);
export const btPrimaryGamePanel = bucket<any>(null);
export const btGamepanels = bucket<Record<string, any> | null>(null);
export const btTeamSettings = bucket<any[]>([]);
export const btTeamSettingsRef = bucket<any>(null);
export const btActionToggle = bucket<boolean>(true);
export const btPrimaryCanvasRef = bucket<any>(null);
export const btMainPageRef = bucket<any>(null);
export const btScoreboardExpanded = bucket<any>(null);
export const btViewerAccordianIndex = bucket<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
export const btScreenConfig = bucket<{
    screentype: number;
    resow: number;
    resoh: number;
    screenwidth: number;
}>({
    screentype: 3,
    resow: 4,
    resoh: 4,
    screenwidth: 1024,
});

export const btDeltaState = bucket<Record<string, any>>({});
export const btHiddenPlayerState = bucket<Record<string, any>>({});
export const btDeltaEncoded = bucket<Record<string, any>>({});

export const btPlayerTeams = bucket<any>(null);
