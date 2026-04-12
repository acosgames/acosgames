import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import GameStateService from "../../services/GameStateService";
import { btGamepanels, btGameState } from "../../actions/buckets";
import { useBucket } from "react-bucketjs";

const HStackMotion = motion(HStack);

interface RenderPlayerProps {
    gamepanelid?: string;
    id: string;
    displayname: string;
    portraitid?: number;
    rating?: any;
    countrycode?: string;
    score?: number;
    team?: any;
}

export default function RenderPlayer({
    gamepanelid,
    id,
    displayname,
    portraitid,
    rating,
    countrycode,
    score,
    team,
}: RenderPlayerProps) {
    const gameState = useBucket(btGameState);

    const isUserNext = GameStateService.validateNextUser(id);
    const filename = `assorted-${portraitid || 1}-medium.webp`;

    return (
        <HStackMotion
            key={"motion-" + displayname}
            position="relative"
            bgColor="gray.950"
            w="100%"
            overflow="visible"
            layout
        >
            <HStack
                w="100%"
                spacing="0rem"
                borderRightRadius={"0"}
                overflow="hidden"
            >
                <Image
                    display="inline-block"
                    src={`https://assets.acos.games/images/portraits/${filename}`}
                    loading="lazy"
                    maxHeight="100%"
                    w={"4rem"}
                    h={"4rem"}
                    position="relative"
                    zIndex="2"
                />
                <VStack
                    w="100%"
                    alignItems={"flex-start"}
                    justifyContent={"flex-start"}
                    spacing="0"
                    flex="1"
                >
                    <HStack w="100%" pl="1rem" pr="1rem">
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
                            {displayname}
                        </Text>
                        <Image
                            src={`https://assets.acos.games/images/country/US.svg`}
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
