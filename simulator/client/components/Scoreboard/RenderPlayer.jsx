import { motion } from "framer-motion";

import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react";
import fs from "flatstore";
import GameStateService from "../../services/GameStateService";
const HStackMotion = motion(HStack);

function IsNextIndicator({ gamepanelid, shortid }) {
    let [gamepanels] = fs.useWatch("gamepanels");
    let isUserNext = GameStateService.validateNextUser(shortid);

    return (
        <Box
            display={isUserNext ? "block" : "none"}
            // borderRadius={"50%"}
            position="absolute"
            top="50%"
            transform="translateY(-50%)"
            left="0rem"
            width="0.8rem"
            h="100%"
            zIndex={1}
            bgColor="brand.100"
        ></Box>
    );
}
export default function RenderPlayer({
    gamepanelid,
    shortid,
    name,
    portraitid,
    rating,
    countrycode,
    score,
    team,
}) {
    let [gameState] = fs.useWatch("gameState");
    let isUserNext = GameStateService.validateNextUser(shortid);

    return (
        <HStackMotion
            key={"motion-" + name}
            position="relative"
            bgColor="gray.950"
            w="100%"
            overflow="visible"
            layout
        >
            {/* <IsNextIndicator gamepanelid={gamepanelid} shortid={shortid} /> */}
            <HStack
                w="100%"
                spacing="0rem"
                borderRightRadius={"0"}
                overflow="hidden"
            >
                <VStack
                    w="100%"
                    alignItems={"flex-start"}
                    justifyContent={"flex-start"}
                    spacing="0"
                    // pr="0.5rem"
                    flex="1"
                    // transform="skew(15deg)"
                >
                    <HStack
                        w="100%"
                        // bgColor={gamepanel.room.isReplay ? "gray.1050" : "gray.1200"}
                        pl="1.5rem"
                        pr="1rem"
                    >
                        <Text
                            as="span"
                            textAlign={"center"}
                            color={isUserNext ? "brand.50" : "gray.50"}
                            fontWeight="500"
                            fontSize={["1.4rem"]}
                            lineHeight={"1.4rem"}
                            maxW={["19rem"]}
                            overflow="hidden"
                            whiteSpace={"nowrap"}
                            textOverflow={"ellipsis"}
                            py="0.5rem"
                        >
                            {name}
                        </Text>

                        <Box flex="1"></Box>
                        <Text
                            color={isUserNext ? "brand.50" : "gray.50"}
                            as="span"
                            fontSize={"1.2rem"}
                        >
                            {score || 0}
                        </Text>
                    </HStack>
                </VStack>
            </HStack>
        </HStackMotion>
    );
}
