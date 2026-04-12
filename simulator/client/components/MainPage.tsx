import { Component, useEffect, useRef } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Box, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import MainHeader from "./MainHeader";
import SidePanel from "./SidePanel";
import GamePanelList from "./GamePanelList";

import { IoSend } from "react-icons/io5";
import { connect } from "../actions/websocket";
import {
    btDisplayMode,
    btIsMobile,
    btMainPageRef,
    btPrimaryCanvasRef,
    btUsername,
    btWebsocketStatus,
} from "../actions/buckets";
import { useBucket } from "react-bucketjs";

function MainPage() {
    const isMobile = useBucket(btIsMobile);
    const displayMode = useBucket(btDisplayMode);
    let displayname = useBucket(btUsername);
    const mainPageRef = useRef<any>();
    const primaryCanvasRef = useRef<any>();

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
        (window as any).gtag?.("event", "mainpage");
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
                    spacing="0"
                    w="100%"
                    h={["3rem", "4rem", "5rem"]}
                    position={
                        displayMode == "theatre" ? "absolute" : "relative"
                    }
                    top={displayMode == "theatre" ? "-100rem" : "0"}
                    zIndex="20"
                    justifyContent={"center"}
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
                        renderView={(props: any) => (
                            <div
                                className="main-scrollbars"
                                style={{
                                    position: "absolute",
                                    inset: "0px",
                                    width: "100%",
                                }}
                                {...props}
                            />
                        )}
                        hideTracksWhenNotNeeded={true}
                        autoHide
                        autoHideTimeout={2000}
                        autoHideDuration={200}
                    >
                        <VStack
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
                                display="flex"
                                flexDirection="column"
                                transition={"filter 0.3s ease-in"}
                            >
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

function ChoosePlayerName() {
    let displayname = useBucket(btUsername) || "Player_0";
    const isMobile = useBucket(btIsMobile);

    const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        btUsername.set(value);
    };

    const onSubmit = async () => {
        localStorage.setItem("displayname", displayname );
        connect(displayname);
    };

    useEffect(() => {
        const savedUsername = localStorage.getItem("displayname");
        if (savedUsername) {
            btUsername.set(savedUsername);
        }
    }, []);

    const wsStatus = useBucket(btWebsocketStatus);
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
                    maxLength={120}
                    height="3rem"
                    autoComplete="off"
                    value={displayname || ""}
                    onChange={inputChange}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            onSubmit();
                        }
                    }}
                />
                <Box width="3rem" height="3rem">
                    <IconButton
                        aria-label="Send"
                        onClick={onSubmit}
                        icon={<IoSend size="1.6rem" />}
                        width="2.8rem"
                        height="2.8rem"
                        isRound={true}
                    />
                </Box>
            </HStack>
        </VStack>
    );
}

export default MainPage;
