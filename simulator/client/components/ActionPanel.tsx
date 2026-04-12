import {
    Box,
    Button,
    HStack,
    Text,
    Tooltip,
    VStack,
    Card,
    CardBody,
    Switch,
} from "@chakra-ui/react";
import {
    autoJoin,
    joinFakePlayer,
    joinGame,
    leaveGame,
    newGame,
    replayNext,
    replayPrev,
    skip,
    startGame,
} from "../actions/game";
import { ReplayControls } from "./StateViewer";
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

export function ActionPanel() {
    return (
        <Box height="100%">
            <GameActionsCompact />
        </Box>
    );
}

function GameActionsCompact() {
    const socketUser = useBucket(btSocketUser);
    const wsStatus = useBucket(btWebsocketStatus);
    const gameStatus = useBucket(btGameStatus);
    const gamePanelLayout = useBucket(btGamepanelLayout);
    const gameState = useBucket(btGameState);
    const gameSettings = useBucket(btGameSettings);

    if (wsStatus == "disconnected") {
        return <></>;
    }

    if(!gameState || !gameSettings) return <></>;
    const isGameRunning =
        gameStatus == GameStateService.statusByName("waiting") ||
        gameStatus == GameStateService.statusByName("pregame") ||
        gameStatus == GameStateService.statusByName("gamestart");
    const isPregame = gameStatus == GameStateService.statusByName("pregame");

    const playerList = Object.keys(gameState.players || {});

    let totalSlotsRemaining: number | boolean = GameStateService.hasVacancy();
    if (gameState.teams) {
        totalSlotsRemaining = 0;
        const teamList: any[] = gameState.teams;
        for (let i = 0; i < teamList.length; i++) {
            const team = teamList[i];
            totalSlotsRemaining =
                (totalSlotsRemaining as number) +
                (GameStateService.hasVacancy(team.team_slug) as number);
        }
    }

    return (
        <HStack height="100%" justifyItems={"center"} alignItems="center">
            <ReplayControls hideTitle={true} />
            <Box w="2rem"></Box>

            <HStack>
                <Button
                    fontSize={"1.4rem"}
                    bgColor={"gray.300"}
                    color="gray.20"
                    onClick={newGame}
                >
                    Reset
                </Button>
            </HStack>
            <Tooltip
                label={
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
                        isDisabled={playerList.length < gameSettings.minplayers}
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

export function GameActionsExpanded() {
    const socketUser = useBucket(btSocketUser);
    const wsStatus = useBucket(btWebsocketStatus);
    const gameStatus = useBucket(btGameStatus);
    const gameState = useBucket(btGameState);
    const gameSettings = useBucket(btGameSettings);
    const autojoin = useBucket(btAutoJoin);

    const onAutoJoin = async (e: React.ChangeEvent<HTMLInputElement>) => {
        btAutoJoin.set(e.target.checked);
        if (e.target.checked == true) {
            autoJoin();
        }
    };

    if (wsStatus == "disconnected") {
        return <></>;
    }

    if(!gameState || !gameSettings || !gameStatus) return <></>;
    const isPregame = gameStatus == GameStateService.statusByName("pregame");

    let totalSlotsRemaining: number | boolean = GameStateService.hasVacancy();
    if (gameState.teams) {
        totalSlotsRemaining = 0;
        const teamList = Object.keys(gameState.teams);
        for (let i = 0; i < teamList.length; i++) {
            const team_slug = teamList[i];
            totalSlotsRemaining =
                (totalSlotsRemaining as number) +
                (GameStateService.hasVacancy(team_slug) as number);
        }
    }

    return (
        <Card>
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
                                        gameStatus == GameStateService.statusByName("gamestart")
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
                                <HStack>
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
                                    as="span"
                                    fontSize="1rem"
                                    color="gray.10"
                                    fontWeight={"500"}
                                >
                                    Auto Join?
                                </Text>
                                <Switch
                                    defaultChecked
                                    value={autojoin ? "true" : "false"}
                                    onChange={onAutoJoin}
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
