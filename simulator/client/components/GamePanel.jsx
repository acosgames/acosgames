import {
    Box,
    Button,
    Center,
    Fade,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Image,
    Portal,
    ScaleFade,
    Text,
    Tooltip,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";

import { MdPerson } from "react-icons/md";
import { IoPersonSharp } from "react-icons/io5";

import { GoEye } from "react-icons/go";
import { CgMinimizeAlt } from "react-icons/cg";
// import { withRouter } from "react-router-dom";
import GamePanelService from "../services/GamePanelService";
import {
    joinFakePlayer,
    joinGame,
    leaveFakePlayer,
    leaveGame,
} from "../actions/game";
import GameStateService from "../services/GameStateService";
import { DisplayUserActions } from "./PlayerList.jsx";
import {
    btDisplayMode,
    btFakePlayers,
    btFullScreenElement,
    btGamepanelLayout,
    btGamepanels,
    btGameSettings,
    btGameState,
    btIFrameRoute,
    btIFrameStyle,
    btIsFullScreen,
    btMainPageRef,
    btPrimaryGamePanel,
} from "../actions/buckets";
import { useBucket } from "react-bucketjs";

function GamePanel(props) {
    let gamepanels = btGamepanels.get() || {};
    let panelCount = Object.keys(gamepanels)?.length;

    return (
        <Box w="100%" h="100%" position="relative">
            <GameIFrame id={props.id} />
        </Box>
    );
}

function GameIFrame(props) {
    let gamepanel = props.gamepanel;
    let displayMode = useBucket(btDisplayMode);
    let gameSettings = useBucket(btGameSettings);
    let iframeRoute = useBucket(btIFrameRoute);

    const [isOpen, setIsOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(true);
    const iframeRef = useRef(null);
    const gamescreenRef = useRef(null);
    const gamewrapperRef = useRef(null);
    const gameResizer = useRef();

    let screentype = Number.parseInt(gameSettings.screentype);
    let resow = gameSettings.resow;
    let resoh = gameSettings.resoh;
    let screenwidth = gameSettings.screenwidth;

    let screenheight = (resoh / resow) * screenwidth;

    var timestamp = 0;
    var THROTTLE = 0;

    const transformStr = (obj) => {
        var obj = obj || {},
            val = "",
            j;
        for (j in obj) {
            val += j + "(" + obj[j] + ") ";
        }

        return `
            -webkit-transform: ${val}; 
            -moz-transform: ${val}; 
            transform: ${val};
            
        `;
    };

    const checkFullScreen = () => {
        if (
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement
        )
            return true;
        else return false;
    };

    const onResize = () => {
        if (!gamescreenRef?.current || !iframeRef?.current) return;

        var now = new Date().getTime();
        if (now - timestamp < THROTTLE) {
            return onResize;
        }
        timestamp = now;

        let isFullscreen = checkFullScreen();
        let windowWidth = gamewrapperRef.current.offsetWidth;
        let windowHeight = gamewrapperRef.current.offsetHeight;

        let offsetRatio = !isLoaded ? 0.1 : 1;

        windowWidth *= offsetRatio;
        windowHeight *= offsetRatio;

        let bgWidth = 0;
        let bgHeight = 0;
        let scale = 1;
        let wsteps = windowWidth / resow;
        let hsteps = windowHeight / resoh;
        let steps = 0;

        if (wsteps < hsteps) {
            steps = wsteps;
        } else {
            steps = hsteps;
        }

        bgWidth = steps * resow;
        bgHeight = steps * resoh;

        // let isUserNext = GameStateService.validateNextUser(props.id);
        let frameBorder = "";
        //  isUserNext
        //     ? "border: 2px solid var(--chakra-colors-brand-50)"
        //     : "border: 2px solid transparent";

        // if (!isUserNext) {
        //     bgWidth -= 2;
        //     // bgHeight -= 2;
        // }
        if (screentype == 3) {
            gamescreenRef.current.style.width = bgWidth + 4 + "px";
            gamescreenRef.current.style.height = bgHeight + 4 + "px";
            scale = bgWidth / screenwidth;

            iframeRef.current.style.transform = `scale(${scale})`;
            iframeRef.current.style.transform += "translateZ(0)";
            iframeRef.current.style["transform-origin"] = "left top";
            iframeRef.current.style.width = screenwidth + "px";
            iframeRef.current.style.height = screenheight + "px";
            // iframeRef.current.setAttribute(
            //     "style",
            //     transformStr({
            //         scale: scale,
            //         translateZ: "0",
            //     }) +
            //         `; transform-origin: left top; width:${screenwidth}px; height:${screenheight}px; ${frameBorder}`
            // );
        } else if (screentype == 2) {
            gamescreenRef.current.style.width = bgWidth + 4 + "px";
            gamescreenRef.current.style.height = bgHeight + 4 + "px";
            iframeRef.current.style.width = "100%";
            iframeRef.current.style.height = "100%";
            // iframeRef.current.setAttribute(
            //     "style",
            //     "width:100%; height:100%;" + frameBorder
            // );
        } else if (screentype == 1) {
            gamescreenRef.current.style.width = windowWidth + 4 + "px";
            gamescreenRef.current.style.height = windowHeight + 4 + "px";
            iframeRef.current.style.width = "100%";
            iframeRef.current.style.height = "100%";
            // iframeRef.current.setAttribute(
            //     "style",
            //     "width:100%; height:100%;" + frameBorder
            // );
        }

        btIFrameStyle.set(iframeRef.current.style);
    };

    let observerTimer = 0;

    const myObserver = new ResizeObserver((entries) => {
        onResize();
    });

    const onFullScreenChange = (evt) => {
        if (document.fullscreenElement) {
            btIsFullScreen.set(true);
        } else {
            btIsFullScreen.set(false);
        }
    };

    useEffect(() => {
        window.addEventListener("resize", onResize);
        document.addEventListener("fullscreenchange", onFullScreenChange);

        let gamepanels = btGamepanels.get();
        let gamepanel = gamepanels[props.id];
        if (gamepanel) {
            gamepanel.iframe = iframeRef;
        }

        btFullScreenElement.set(gameResizer);

        const mainPageRef = btMainPageRef.get();
        myObserver.observe(mainPageRef.current);

        setTimeout(() => {
            setIsOpen(true);
        }, 10);

        return () => {
            window.removeEventListener("resize", onResize);
            setIsOpen(false);
        };
    }, []);

    useEffect(() => {
        onResize();
    });

    let lastMessage = btGameState.get();
    let players = lastMessage?.players || {};

    let isSpectator = !(props.id in players);

    // let user = GamePanelService.getUserById(props.id);

    return (
        <VStack
            spacing="0"
            width="100%"
            height="100%"
            position="absolute"
            zIndex={10}
            top={0}
            left={0}
            justifyContent={"center"}
            alignContent={"center"}
            ref={gameResizer}
            transition={"filter 0.3s ease-in, opacity 0.5s ease-in"}
            filter={isOpen ? "opacity(1)" : "opacity(0)"}
            className={"gameResizer"}
        >
            <VStack
                className="screen-wrapper"
                w="100%"
                h={"100%"}
                ref={gamewrapperRef}
                transition={"filter 0.3s ease-in, opacity 0.5s ease-in"}
                filter={isOpen ? "opacity(1)" : "opacity(0)"}
                justifyContent={"flex-start"}
                alignContent={"center"}
                position="relative"
            >
                <Box
                    ref={gamescreenRef}
                    height="100%"
                    position="relative"
                    // boxShadow={"0px 12px 24px rgba(0,0,0,0.2)"}
                    alignSelf="center"
                    // bgColor="gray.700"
                    // visibility={gamepanel?.iframe?.current ? "visible" : "hidden"}
                    // boxSizing="content-box"

                    border="2px solid var(--chakra-colors-gray-700)"
                    boxShadow={
                        "0 19px 38px rgba(0,0,0,0.50), 0 15px 12px rgba(0,0,0,0.4)"
                    }
                >
                    <iframe
                        className="gamescreen"
                        ref={iframeRef}
                        onLoad={() => {
                            let gamepanels = btGamepanels.get();
                            let gamepanel = gamepanels[props.id];

                            gamepanel.iframe = iframeRef;
                            iframeRef.current.style.visibility = "visible";
                            // iframeRef.current.style.border =
                            //     "3px solid var(--chakra-colors-gray-800)";
                            // iframeRef.current.style["box-shadow"] =
                            //     "0 0 5px var(--chakra-colors-gray-1000), 0 0 10px var(--chakra-colors-gray-1000)";
                            onResize();

                            setTimeout(() => {
                                GameStateService.updateGamePanel(props.id);
                            }, 100);
                        }}
                        src={
                            iframeRoute
                                ? iframeRoute
                                : "//localhost:3100/iframe.html"
                        }
                        sandbox="allow-scripts  allow-same-origin"
                        allowtransparency="true"
                    />
                    {/* <HStack
                        position={"absolute"}
                        top={"-3rem"}
                        left="0"
                        height="3rem"
                        width="100%"
                    >
                        <DisplayUserInfo id={props.id} iframeRef={iframeRef} />
                    </HStack> */}
                </Box>
            </VStack>

            {/* <Box
                position="absolute"
                bottom="1rem"
                right="1rem"
                display={
                    props.isFullScreen || displayMode == "theatre"
                        ? "block"
                        : "none"
                }
            >
                <IconButton
                    fontSize={"2rem"}
                    colorScheme={"clear"}
                    icon={<CgMinimizeAlt color="gray.300" />}
                    onClick={() => {
                        if (props.displayMode == "theatre") {
                            btDisplayMode.set("none");
                        }
                        if (props.isFullScreen) document.exitFullscreen();
                        // openFullscreen(props.fullScreenElem)
                    }}
                >
                    Exit Full Screen
                </IconButton>
            </Box> */}
        </VStack>
    );
}

function DisplayUserInfo(props) {
    let lastMessage = useBucket(btGameState);

    let isInGame = false;
    let players = lastMessage?.players;
    if (players && props.id in players) {
        isInGame = true;
    }

    let user = GamePanelService.getUserById(props.id);

    let isUserNext = GameStateService.validateNextUser(props.id);

    let color = "gray.400";
    if (isInGame) {
        color = "gray.200";
    }
    if (isUserNext) color = "gray.30";

    let fakePlayers = btFakePlayers.get() || {};

    let fakePlayerList = Object.keys(fakePlayers);

    return (
        <HStack
            // spacing="1rem"
            px="3rem"
            width="100%"
            // height="3rem"
            justifyContent={"center"}
            position="relative"
            alignItems={"center"}
            boxSizing="border-box"
            // bgColor="gray.700"
            // borderTop={
            //     isUserNext
            //         ? "2px solid var(--chakra-colors-brand-500)"
            //         : "2px solid transparent"
            // }
            bgColor={"gray.950"}
        >
            <HStack
                px="2rem"
                onClick={() => {
                    let fakePlayers = btFakePlayers.get();
                    let fakePlayerList = Object.keys(fakePlayers || {}) || [];
                    let gamepanels = btGamepanels.get();
                    let gamepanel = gamepanels[props.id];
                    if (gamepanel) {
                        let primaryGamePanel = btPrimaryGamePanel.get();

                        //go back to compact if selecting again
                        if (
                            gamepanel == primaryGamePanel &&
                            fakePlayerList.length < 7
                        ) {
                            btPrimaryGamePanel.set(null);
                            btGamepanelLayout.set("compact");
                            return;
                        }

                        btPrimaryGamePanel.set(gamepanel);
                    }
                    btGamepanelLayout.set("expanded");
                }}
            >
                <Tooltip
                    label={isInGame ? "In game" : "Spectator"}
                    placement="bottom"
                >
                    <Text
                        as="span"
                        //  lineHeight={"3rem"}
                        h="1.8rem"
                        p="0"
                    >
                        <Icon
                            color={color}
                            as={isInGame ? IoPersonSharp : GoEye}
                            w="1.2rem"
                            h="1.2rem"
                            p="0"
                        />
                    </Text>
                </Tooltip>
                <Tooltip label={user.id} placement="bottom">
                    <Text
                        // lineHeight={"3.4rem"}
                        // height="3rem"
                        cursor={"pointer"}
                        color={color}
                        as="span"
                        display="inline-block"
                        fontSize="1.1rem"
                        fontWeight="500"
                    >
                        {user.name}
                    </Text>
                </Tooltip>
            </HStack>
            <Box
                position="absolute"
                right="1rem"
                top="50%"
                transform="translateY(-50%)"
                display={fakePlayerList.length < 8 ? "block" : "none"}
            >
                <DisplayUserActions id={props.id} from={"gamepanel"} />
            </Box>
        </HStack>
    );
}

export default GamePanel;
