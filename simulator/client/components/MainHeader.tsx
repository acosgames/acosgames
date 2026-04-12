import {
    Box,
    Flex,
    Stack,
    Image,
    HStack,
    Button,
    Text,
    VStack,
} from "@chakra-ui/react";

import { ActionPanel } from "./ActionPanel";
import Timeleft from "./Timeleft";
import { useBucket } from "react-bucketjs";
import { btActionToggle, btGameStatus, btIsMobile, btReplayStats } from "../actions/buckets";
import GameStateService from "../services/GameStateService";
import { GameStatus } from "@acosgames/framework";

export default function MainHeader() {
    const isMobile = useBucket(btIsMobile);
    const actionToggle = useBucket(btActionToggle);
    let gameStatus = useBucket(btGameStatus);
    const replayStats = useBucket(btReplayStats);

    let statusColor = "white";
    if (gameStatus == GameStatus.pregame) statusColor = "yellow.400";
    else if (
        gameStatus == GameStatus.gameover ||
        gameStatus == GameStatus.gamecancelled ||
        gameStatus == GameStatus.gameerror
    ) {
        statusColor = "red.300";
    } else if (gameStatus == GameStatus.gamestart) {
        statusColor = "green.300";
    } else if (gameStatus == GameStatus.none) {
        gameStatus = GameStatus.waiting;
    }

    const isGameActive =
        replayStats && replayStats?.position >= replayStats?.total &&
        gameStatus == GameStatus.gamestart;

    return (
        <Box
            zIndex="20"
            display={"flex"}
            transition={"filter 0.3s ease-in"}
            width="100%"
            h={["3rem", "4rem", "5rem"]}
            justifyContent={"center"}
            className="mainmenuchakra"
        >
            <Flex
                alignItems={"center"}
                justifyContent={"space-between"}
                h={["3rem", "4rem", "5rem"]}
                width="100%"
            >
                <HStack
                    spacing={["2rem", "2rem", "4rem"]}
                    justifyContent={"center"}
                    opacity={isGameActive ? "0.1" : "1"}
                >
                    <VStack justifyContent={"center"} spacing={"0"}>
                        <Image
                            alt={"A cup of skill logo"}
                            src={`https://assets.acos.games/acos-logo-2025.png`}
                            h={["1.8rem", "1.8rem", "3rem"]}
                            maxHeight={"90%"}
                        />
                        <Text fontSize="1rem">SIMULATOR</Text>
                    </VStack>
                </HStack>
                <HStack w="100%" lineHeight="100%" pl="2rem">
                    <Text
                        fontSize="2rem"
                        fontWeight={"100"}
                        as="span"
                        width="16rem"
                        color={statusColor}
                    >
                        {GameStatus[gameStatus].toUpperCase()}
                    </Text>
                    <Box w="10rem" alignSelf={"center"} justifySelf={"center"}>
                        <Timeleft />
                    </Box>
                </HStack>

                <Flex
                    justifyContent={"flex-end"}
                    alignItems={"center"}
                    height="100%"
                    flex="1"
                    display={["none", "none", "flex"]}
                    opacity={isGameActive ? "0.9" : "1"}
                >
                    <Stack direction={"row"} spacing={0} height="100%">
                        <Box w="30rem">
                            <ActionPanel />
                        </Box>
                    </Stack>
                </Flex>
            </Flex>
        </Box>
    );
}
