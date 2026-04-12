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

export default function MainHeader() {
    const isMobile = useBucket(btIsMobile);
    const actionToggle = useBucket(btActionToggle);
    let gameStatus = useBucket(btGameStatus);
    const replayStats = useBucket(btReplayStats);

    let statusColor = "white";
    if (gameStatus == GameStateService.statusByName("pregame")) statusColor = "yellow.200";
    else if (
        gameStatus == GameStateService.statusByName("gameover") ||
        gameStatus == GameStateService.statusByName("gamecancelled") ||
        gameStatus == GameStateService.statusByName("gameerror")
    ) {
        statusColor = "red.300";
    } else if (gameStatus == GameStateService.statusByName("gamestart")) {
        statusColor = "green.200";
    } else if (gameStatus == GameStateService.statusByName("none")) {
        gameStatus = GameStateService.statusByName("waiting");
    }

    const isGameActive =
        replayStats && replayStats?.position >= replayStats?.total &&
        gameStatus == GameStateService.statusByName("gamestart");

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
                        {gameStatus}
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
