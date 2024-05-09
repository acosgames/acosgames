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
    let filename = `assorted-${portraitid || 1}-medium.webp`;
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
                // alignItems={"flex-start"}
            >
                <Image
                    display="inline-block"
                    src={`https://assets.acos.games/images/portraits/${filename}`}
                    loading="lazy"
                    // borderRadius={"8px"}
                    maxHeight="100%"
                    w={"4rem"}
                    h={"4rem"}
                    // mb="1rem"
                    position="relative"
                    zIndex="2"
                    // transform="skew(15deg)"
                    // border="1px solid"
                    // borderColor={player.ready ? "brand.100" : "brand.900"}
                />
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
                        pl="1rem"
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
                        <Image
                            src={`https://assets.acos.games/images/country/US.svg`}
                            // mt="0.5rem"
                            borderColor="gray.100"
                            borderRadius="0px"
                            width="1.75rem"
                            filter="opacity(0.8)"
                        />
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
