import {
    Box,
    HStack,
    VStack,
    Text,
    Button,
    Icon,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Tab,
} from "@chakra-ui/react";
import { useState } from "react";

import {
    CgChevronDoubleRightR,
    CgChevronDoubleDownR,
    CgChevronDoubleUpR,
    CgChevronDoubleLeftR,
} from "react-icons/cg";

import { GoSidebarExpand, GoSidebarCollapse } from "react-icons/go";

import { BsChatDotsFill } from "react-icons/bs";
import { AiFillCloseCircle } from "react-icons/ai";
// import { ImEnter } from 'react-icons/bs';

import { saveGameSettings } from "../actions/websocket";
import { Settings } from "./GameSettings.jsx";
import {
    DisplayMyPlayers,
    // DisplayGamePlayers,
    // DisplayGameActions,
} from "./PlayerList.jsx";
import { GameActionsExpanded } from "./ActionPanel.jsx";
import { StateViewer } from "./StateViewer.jsx";
import Scoreboard from "./Scoreboard/Scoreboard";
import { useBucket } from "react-bucketjs";
import {
    btActionToggle,
    btDisplayMode,
    btGameSettings,
    btIsMobile,
    btLocalGameSettings,
} from "../actions/buckets";
// import Scoreboard from "./Scoreboard.jsx";

function SidePanel(props) {
    let actionToggle = useBucket(btActionToggle);
    let isMobile = useBucket(btIsMobile);
    let displayMode = useBucket(btDisplayMode);

    let toggle = actionToggle && displayMode != "theatre";
    let desktopIcon = toggle ? (
        <Icon
            as={AiFillCloseCircle}
            filter={"drop-shadow(0px -12px 24px rgba(0,0,0,0.2))"}
            fontSize="2rem"
            color={"gray.400"}
        />
    ) : (
        <Icon
            as={BsChatDotsFill}
            filter={"drop-shadow(0px -12px 24px rgba(0,0,0,0.2))"}
            fontSize="2rem"
            color={"gray.100"}
        />
    );
    let mobileIcon = toggle ? (
        <Icon
            as={AiFillCloseCircle}
            filter={"drop-shadow(0px -12px 24px rgba(0,0,0,0.2))"}
            fontSize="2rem"
            color={"gray.400"}
        />
    ) : (
        <Icon
            as={BsChatDotsFill}
            filter={"drop-shadow(0px -12px 24px rgba(0,0,0,0.2))"}
            fontSize="2rem"
            color={"gray.100"}
        />
    );

    return (
        <HStack
            spacing="0"
            m="0"
            p="0"
            bgColor={"gray.925"}
            position={"relative"}
            flexGrow="1 !important"
            height={!isMobile ? "100%" : toggle ? "20rem" : "0"}
            transition="width 0.3s ease, height 0.3s ease"
            zIndex={30}
            width={
                isMobile
                    ? "100%"
                    : toggle
                    ? ["44.0rem", "44rem", "28.0rem", "48.0rem"]
                    : "0"
            }
            borderLeft="2px solid var(--chakra-colors-gray-975)"
            boxShadow="inset 0 0 4px rgba(25,25,25,.9)"
            role="group"
        >
            <Box
                p="0"
                m="0"
                height="3rem"
                width="3rem"
                position="absolute"
                left="-2.5rem"
                top="1rem"
                zIndex="100"
            >
                <Button
                    onClick={() => {
                        btActionToggle.set(!actionToggle);
                    }}
                    height="100%"
                    bgColor="transparent"
                    _hover={{ bgColor: "transparent" }}
                    p="0"
                >
                    <Icon
                        as={actionToggle ? GoSidebarCollapse : GoSidebarExpand}
                        filter={"drop-shadow(0px -12px 24px rgba(0,0,0,0.2))"}
                        fontSize="2.5rem"
                        color={"gray.100"}
                        _hover={{
                            color: "gray.10",
                        }}
                    />
                </Button>
            </Box>

            <VStack
                transition="width 0.3s ease, height 0.3s ease"
                width={isMobile ? "100%" : ["24.0rem", "24rem", "28.0rem"]}
                height={!isMobile ? "100%" : toggle ? "20rem" : "0"}
                alignItems="stretch"
                pb={"1rem"}
                position="relative"
                flexGrow="1 !important"
                display="flex !important"
                flexDirection="column !important"
                mt="0"
            >
                <Tabs h="100%" px="0" variant="subtabs" defaultIndex={0}>
                    <TabList
                        zIndex="20"
                        display={"flex"}
                        bgColor={"gray.975"}
                        transition={"filter 0.3s ease-in"}
                        width="100%"
                        maxWidth="1200px"
                        h={["3rem", "4rem", "5rem"]}
                        justifyContent={"center"}
                        borderBottom="0"
                    >
                        <Tab _focus={{ outline: "none" }}>Players</Tab>
                        <Tab _focus={{ outline: "none" }}>JSON</Tab>
                        <Tab _focus={{ outline: "none" }}>Settings</Tab>
                        <Tab _focus={{ outline: "none" }}>Stats</Tab>
                    </TabList>

                    <TabPanels h="100%" p="0" pl="0.5rem">
                        <TabPanel
                            h="100%"
                            overflow="hidden"
                            overflowY="scroll"
                            px="0"
                            p="0"
                            pr="0.5rem"
                        >
                            <Box pb="5rem" pt="1rem">
                                <GameActionsExpanded />
                                {/* <DisplayGamePlayers /> */}
                                <Scoreboard />
                                <DisplayMyPlayers />
                            </Box>
                        </TabPanel>
                        <TabPanel
                            h="100%"
                            overflow="hidden"
                            overflowY="scroll"
                            px="0"
                            p="0"
                            pr="0.5rem"
                        >
                            <Box pb="5rem" pt="1rem">
                                <StateViewer />
                            </Box>
                        </TabPanel>
                        <TabPanel
                            h="100%"
                            overflow="hidden"
                            overflowY="scroll"
                            px="0"
                            p="0"
                            pr="0.5rem"
                        >
                            <VStack
                                justifyContent={"flex-start"}
                                spacing="2rem"
                                pb={"4rem"}
                                px="0"
                                pt="2rem"
                            >
                                <Settings />
                            </VStack>
                        </TabPanel>
                        <TabPanel></TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </HStack>
    );
}

export default SidePanel;
