import { Component, useEffect, useRef } from "react";

// import { withRouter } from "react-router-dom";
// import GameList from "./games/GameList";

import { Scrollbars } from "react-custom-scrollbars-2";
import { Box, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import MainHeader from "./MainHeader.jsx";
import SidePanel from "./SidePanel.jsx";
import GamePanelList from "./GamePanelList.jsx";

import { IoSend } from "react-icons/io5";
import { connect } from "../actions/websocket";
import {
    btDisplayMode,
    btIsMobile,
    btMainPageRef,
    btPrimaryCanvasRef,
    btUsername,
    btWebsocketStatus,
} from "../actions/buckets.js";
import { useBucket } from "react-bucketjs";

function MainPage(props) {
    let isMobile = useBucket(btIsMobile);
    let displayMode = useBucket(btDisplayMode);

    let displayname = useBucket(btUsername);
    const mainPageRef = useRef();
    const primaryCanvasRef = useRef();

    useEffect(() => {
        btPrimaryCanvasRef.set(primaryCanvasRef);

        btMainPageRef.set(mainPageRef);

        if (!displayname) {
            displayname = "Player_0";
            btUsername.set(displayname);
            localStorage.setItem("displayname", displayname);
            connect(displayname);
        }
    });

    useEffect(() => {
        gtag("event", "mainpage");
    }, []);

    return (
        <HStack
            overflow="hidden"
            className="wrapper"
            spacing="0"
            width="100%"
            height="100%"
            m="0"
            p="0"
            justifyContent={"center"}
        >
            <VStack
                className="panel-main"
                height="100%"
                width="100%"
                spacing="0"
                justifyContent={"center"}
            >
                <HStack
                    boxShadow={"#0003 0 4px 6px -1px, #0000001f 0 2px 4px -1px"}
                    spacing="0"
                    w="100%"
                    h={["3rem", "4rem", "5rem"]}
                    position={
                        displayMode == "theatre" ? "absolute" : "relative"
                    }
                    top={displayMode == "theatre" ? "-100rem" : "0"}
                    zIndex="20"
                    justifyContent={"center"}
                    // overflow="hidden"
                    px={["0.5rem", "1rem", "5rem"]}
                    bg={"gray.975"}
                >
                    <MainHeader />
                </HStack>

                <Box
                    id="main-content"
                    w="100%"
                    h={["100%"]}
                    position="relative"
                    ref={primaryCanvasRef}
                >
                    <Scrollbars
                        renderView={(props) => (
                            <div
                                className="main-scrollbars"
                                style={{
                                    position: "absolute",
                                    inset: "0px",
                                    //overflow: 'hidden scroll',
                                    width: "100%",
                                    // marginRight: '-8px',
                                    // marginBottom: '-8px'
                                }}
                            />
                        )}
                        // renderThumbVertical={(style, props) => <Box  {...props} {...style} w="10px" bgColor={'blacks.700'} className="thumb-vertical" />}
                        hideTracksWhenNotNeeded={true}
                        autoHide
                        autoHideTimeout={2000}
                        autoHideDuration={200}
                    >
                        <VStack
                            //px={['0.5rem', '1rem', '5rem']}
                            // pt={'2.5rem'}
                            spacing="0"
                            justifyContent={"center"}
                            w="100%"
                            height="100%"
                            ref={mainPageRef}
                        >
                            <Box
                                position="relative"
                                flexGrow="1 "
                                height="100% "
                                width="100%"
                                // maxWidth="1200px"
                                display="flex"
                                flexDirection="column"
                                transition={"filter 0.3s ease-in"}
                                // maxW={['1200px']}
                            >
                                {/* <ChoosePlayerName /> */}
                                <GamePanelList />
                            </Box>
                        </VStack>
                    </Scrollbars>
                </Box>
                {isMobile && <SidePanel />}
            </VStack>
            {!isMobile && <SidePanel />}
        </HStack>
    );
}

function ChoosePlayerName(props) {
    let displayname = useBucket(btUsername);
    let isMobile = useBucket(btIsMobile);

    const inputChange = (e) => {
        let name = e.target.name;
        let value = e.target.value;

        btUsername.set(value);
    };

    const onSubmit = async (e) => {
        localStorage.setItem("displayname", displayname);
        connect(displayname);
    };

    useEffect(() => {
        let savedUsername = localStorage.getItem("displayname");
        if (savedUsername) {
            btUsername.set(savedUsername);
        }
    }, []);

    let wsStatus = useBucket(btWebsocketStatus);
    if (wsStatus == "connected" || wsStatus == "ingame") {
        return <></>;
    }

    return (
        <VStack
            w="100%"
            h="100%"
            alignContent={"center"}
            alignItems="center"
            justifyContent={"center"}
        >
            <Text fontWeight="bold" fontSize="3rem">
                Choose Player Name
            </Text>
            <HStack
                width={isMobile ? "100%" : ["24.0rem", "24rem", "28.0rem"]}
                height="3rem"
                px="2rem"
            >
                <Input
                    name="displayname"
                    id="displayname"
                    title=""
                    maxLength="120"
                    height="3rem"
                    autoComplete="off"
                    value={displayname || ""}
                    onChange={inputChange}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            onSubmit(e);
                        }
                    }}
                />
                <Box width="3rem" height="3rem">
                    <IconButton
                        onClick={onSubmit}
                        icon={<IoSend size="1.6rem" />}
                        width="2.8rem"
                        height="2.8rem"
                        isRound="true"
                    />
                </Box>
            </HStack>
        </VStack>
    );
}

export default MainPage;
