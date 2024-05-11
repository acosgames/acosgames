import {
    Box,
    Button,
    HStack,
    Text,
    Tooltip,
    VStack,
    Card,
    CardHeader,
    CardBody,
    Switch,
} from "@chakra-ui/react";
import {
    joinFakePlayer,
    joinGame,
    leaveGame,
    newGame,
    replayNext,
    replayPrev,
    skip,
    sleep,
    startGame,
} from "../actions/game";
import { ReplayControls } from "./StateViewer.jsx";
import GameStateService from "../services/GameStateService";
import { useBucket } from "react-bucketjs";
import {
    btAutoJoin,
    btFakePlayers,
    btGamepanelLayout,
    btGameSettings,
    btGameState,
    btGameStatus,
    btSocketUser,
    btWebsocketStatus,
} from "../actions/buckets";

export function ActionPanel(props) {
    return (
        <Box height="100%">
            <GameActionsCompact />
        </Box>
    );
}

function GameActionsCompact(props) {
    let socketUser = useBucket(btSocketUser);
    let wsStatus = useBucket(btWebsocketStatus);
    let gameStatus = useBucket(btGameStatus);
    let gamePanelLayout = useBucket(btGamepanelLayout);
    let gameState = useBucket(btGameState);
    let gameSettings = useBucket(btGameSettings);

    // gamePanelLayout = gamePanelLayout || 'compact';

    if (wsStatus == "disconnected") {
        return <></>;
    }

    let isGameRunning = gameStatus != "gameover" && gameStatus != "none";
    let isPregame = gameStatus == "pregame";
    let isInGame = gameStatus != "gamestart";
    let isGameOver = gameStatus == "gameover";

    let playerList = Object.keys(gameState.players || {});

    let totalSlotsRemaining = GameStateService.hasVacancy();
    if (gameState.teams) {
        totalSlotsRemaining = 0;
        let teamList = Object.keys(gameState.teams);
        for (let i = 0; i < teamList.length; i++) {
            let team_slug = teamList[i];
            totalSlotsRemaining += GameStateService.hasVacancy(team_slug);
        }
    }

    return (
        <HStack height="100%" justifyItems={"center"} alignItems="center">
            {/* 
            <HStack display={isGameRunning ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'red.800'}
                    onClick={leaveGame}>
                    {'Leave'}
                </Button>
            </HStack> */}
            {/* <HStack display={gameStatus == 'none' ? 'flex' : 'none'}>
                <Button onClick={() => {
                    joinGame()
                }}>
                    Join Game
                </Button>
            </HStack> */}
            <ReplayControls hideTitle={true} />
            <Box w="2rem"></Box>

            <HStack
            // display={isInGame ? "flex" : "none"}
            >
                <Button
                    fontSize={"1.4rem"}
                    bgColor={"gray.300"}
                    color="gray.20"
                    onClick={newGame}
                >
                    Reset
                </Button>
            </HStack>
            {/* <HStack display={gameStatus == "gamestart" ? "flex" : "none"}>
                <Button
                    fontSize={"xxs"}
                    color="gray.1200"
                    bgColor={"brand.700"}
                    onClick={skip}
                >
                    Skip
                </Button>
            </HStack> */}
            <Tooltip
                title={
                    playerList.length < gameSettings.minplayers
                        ? "Not enough players"
                        : ""
                }
            >
                <HStack
                    visibility={
                        isPregame && !totalSlotsRemaining ? "visible" : "hidden"
                    }
                >
                    <Button
                        disabled={playerList.length < gameSettings.minplayers}
                        fontSize={"1.4rem"}
                        bgColor={"green.500"}
                        _hover={{ bgColor: "brand.500" }}
                        onClick={startGame}
                    >
                        {"Start"}
                    </Button>
                </HStack>
            </Tooltip>

            <Box w="2rem"></Box>
        </HStack>
    );
}

export function GameActionsExpanded(props) {
    let socketUser = useBucket(btSocketUser);
    let wsStatus = useBucket(btWebsocketStatus);
    let gameStatus = useBucket(btGameStatus);
    let gamePanelLayout = useBucket(btGamepanelLayout);
    let gameState = useBucket(btGameState);
    let gameSettings = useBucket(btGameSettings);
    let autojoin = useBucket(btAutoJoin);

    // gamePanelLayout = gamePanelLayout || 'compact';

    if (wsStatus == "disconnected") {
        return <></>;
    }

    let isGameRunning = gameStatus != "gameover" && gameStatus != "none";
    let isPregame = gameStatus == "pregame";
    let isInGame = gameStatus != "gamestart";
    let isGameOver = gameStatus == "gameover";

    let totalSlotsRemaining = GameStateService.hasVacancy();
    if (gameState.teams) {
        totalSlotsRemaining = 0;
        let teamList = Object.keys(gameState.teams);
        for (let i = 0; i < teamList.length; i++) {
            let team_slug = teamList[i];
            totalSlotsRemaining += GameStateService.hasVacancy(team_slug);
        }
    }

    return (
        <Card>
            {/* <CardHeader>
                <Text fontWeight="500">Game Actions</Text>
            </CardHeader> */}
            <CardBody>
                <VStack height="100%" w="100%">
                    <HStack w="100%">
                        <Box maxW="15rem">
                            <ReplayControls />
                        </Box>
                        <Box flex="1"></Box>
                        <VStack gap="1rem">
                            <HStack>
                                <HStack
                                    visibility={
                                        gameStatus == "gamestart"
                                            ? "visible"
                                            : "hidden"
                                    }
                                >
                                    <Button
                                        fontSize={"1.4rem"}
                                        fontWeight="600"
                                        color="gray.0"
                                        bgColor={"orange.500"}
                                        onClick={skip}
                                    >
                                        Skip
                                    </Button>
                                </HStack>
                                <HStack
                                //  display={isInGame ? "flex" : "none"}
                                >
                                    <Button
                                        fontSize={"1.4rem"}
                                        bgColor={"gray.300"}
                                        color="gray.20"
                                        onClick={newGame}
                                    >
                                        Reset
                                    </Button>
                                </HStack>

                                <HStack
                                    visibility={
                                        isPregame && !totalSlotsRemaining
                                            ? "visible"
                                            : "hidden"
                                    }
                                >
                                    <Button
                                        fontSize={"1.4rem"}
                                        bgColor={"green.500"}
                                        _hover={{ bgColor: "brand.500" }}
                                        onClick={startGame}
                                    >
                                        {"Start"}
                                    </Button>
                                </HStack>
                            </HStack>
                            <HStack>
                                <Text
                                    display={
                                        props.hideTitle
                                            ? "none"
                                            : "inline-block"
                                    }
                                    as="span"
                                    fontSize="1rem"
                                    color="gray.10"
                                    fontWeight={"500"}
                                >
                                    Auto Join?
                                </Text>
                                <Switch
                                    value={autojoin}
                                    onChange={async (e) => {
                                        btAutoJoin.set(e.target.checked);
                                        if (e.target.checked == true) {
                                            joinGame();
                                            await sleep(300);
                                            let fakePlayers =
                                                btFakePlayers.get() || {};
                                            for (let id in fakePlayers) {
                                                joinFakePlayer(fakePlayers[id]);
                                                await sleep(300);
                                            }
                                        }
                                    }}
                                ></Switch>
                            </HStack>
                        </VStack>

                        <Box pr="1rem"></Box>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
}
