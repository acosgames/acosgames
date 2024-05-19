import {
    Box,
    Flex,
    Stack,
    Image,
    HStack,
    Icon,
    Button,
    Text,
    Divider,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
// import config from '../config'

import { ActionPanel } from "./ActionPanel.jsx";
import Timeleft from "./Timeleft.jsx";
import { useBucket } from "react-bucketjs";
import {
    btActionToggle,
    btGameStatus,
    btIsMobile,
    btReplayStats,
} from "../actions/buckets.js";
// import GameActions from './games/GameDisplay/GameActions';

export default function MainHeader(props) {
    let isMobile = useBucket(btIsMobile);
    let actionToggle = useBucket(btActionToggle);
    let gameStatus = useBucket(btGameStatus);
    let replayStats = useBucket(btReplayStats);

    let statusColor = "white";
    if (gameStatus == "pregame") statusColor = "yellow.200";
    else if (
        gameStatus == "gameover" ||
        gameStatus == "gamecancelled" ||
        gameStatus == "gameerror"
    ) {
        statusColor = "red.300";
    } else if (gameStatus == "gamestart") {
        statusColor = "green.200";
    } else if (gameStatus == "none") {
        gameStatus = "waiting";
    }
    let isGameActive =
        replayStats?.position >= replayStats?.total &&
        gameStatus == "gamestart";
    return (
        <Box
            zIndex="20"
            display={"flex"}
            transition={"filter 0.3s ease-in"}
            width="100%"
            // maxWidth="1200px"
            h={["3rem", "4rem", "5rem"]}
            justifyContent={"center"}
            className="mainmenuchakra"
        >
            <Flex
                alignItems={"center"}
                justifyContent={"space-between"}
                h={["3rem", "4rem", "5rem"]}
                width="100%"
                // maxW={["1200px"]}
            >
                <HStack
                    spacing={["2rem", "2rem", "4rem"]}
                    justifyContent={"center"}
                    opacity={isGameActive ? "0.1" : "1"}
                >
                    <Box>
                        <Link to="/" className="">
                            <Image
                                alt={"A cup of skill logo"}
                                src={`https://cdn.acos.games/file/acospub/acos-logo-standalone4.png`}
                                h={["1.8rem", "1.8rem", "3rem"]}
                                maxHeight={"90%"}
                            />
                            <Text fontSize="1rem">SIMULATOR</Text>
                        </Link>
                    </Box>
                </HStack>
                <HStack w="100%" lineHeight="100%" pl="2rem">
                    <Text
                        fontSize="2rem"
                        fontWeight={"100"}
                        as="span"
                        width="12rem"
                        color={statusColor}
                    >
                        {gameStatus}
                    </Text>
                    <Box w="10rem" alignSelf={"center"} justifySelf={"center"}>
                        <Timeleft />
                    </Box>
                    {/* <Divider orientation="vertical" /> */}
                </HStack>

                <Flex
                    justifyContent={"flex-end"}
                    alignItems={"center"}
                    height="100%"
                    flex="1"
                    display={["none", "none", "flex"]}
                    opacity={isGameActive ? "0.1" : "1"}
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
