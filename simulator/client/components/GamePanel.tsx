import {
    Box,
    Button,
    Center,
    Fade,
    Flex,
    HStack,
    Icon,
    IconButton,
    Image,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";

import { IoPersonSharp } from "react-icons/io5";
import { GoEye } from "react-icons/go";
import GamePanelService from "../services/GamePanelService";
import {
    joinFakePlayer,
    joinGame,
    leaveFakePlayer,
    leaveGame,
} from "../actions/game";
import GameStateService from "../services/GameStateService";
import { DisplayUserActions } from "./PlayerList";
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

function GamePanel(props: { shortid: string }) {
    return (
        <Box w="100%" h="100%" position="relative">
            <GameIFrame shortid={props.shortid} />
        </Box>
    );
}

function GameIFrame(props: { shortid: string; gamepanel?: any }) {
    const displayMode = useBucket(btDisplayMode);
    const gameSettings = useBucket(btGameSettings);
    const iframeRoute = useBucket(btIFrameRoute);

    const [isOpen, setIsOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const gamescreenRef = useRef<HTMLDivElement>(null);
    const gamewrapperRef = useRef<HTMLDivElement>(null);
    const gameResizer = useRef<HTMLDivElement>(null);

    if( !gameSettings) {
        return <></>;
    }
    const screentype = Number.parseInt(gameSettings.screentype);
    const resow = gameSettings.resow;
    const resoh = gameSettings.resoh;
    const screenwidth = gameSettings.screenwidth;
    const screenheight = (resoh / resow) * screenwidth;

    let timestamp = 0;
    const THROTTLE = 0;

    const checkFullScreen = () => {
        if (
            (document as any).fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement
        )
            return true;
        else return false;
    };

    const onResize = () => {
        if (!gamescreenRef?.current || !iframeRef?.current) return;

        const now = Date.now();
        if (now - timestamp < THROTTLE) {
            return;
        }
        timestamp = now;

        const isFullscreen = checkFullScreen();
        const windowWidth = gamewrapperRef.current!.offsetWidth;
        const windowHeight = gamewrapperRef.current!.offsetHeight;

        const offsetRatio = !isLoaded ? 0.1 : 1;
        const ww = windowWidth * offsetRatio;
        const wh = windowHeight * offsetRatio;

        let bgWidth = 0;
        let bgHeight = 0;
        const wsteps = ww / resow;
        const hsteps = wh / resoh;
        const steps = wsteps < hsteps ? wsteps : hsteps;

        bgWidth = steps * resow;
        bgHeight = steps * resoh;

        if (screentype == 3) {
            gamescreenRef.current.style.width = bgWidth + 4 + "px";
            gamescreenRef.current.style.height = bgHeight + 4 + "px";
            const scale = bgWidth / screenwidth;

            iframeRef.current.style.transform = `scale(${scale})`;
            iframeRef.current.style.transform += "translateZ(0)";
            (iframeRef.current.style as any)["transform-origin"] = "left top";
            iframeRef.current.style.width = screenwidth + "px";
            iframeRef.current.style.height = screenheight + "px";
        } else if (screentype == 2) {
            gamescreenRef.current.style.width = bgWidth + 4 + "px";
            gamescreenRef.current.style.height = bgHeight + 4 + "px";
            iframeRef.current.style.width = "100%";
            iframeRef.current.style.height = "100%";
        } else if (screentype == 1) {
            gamescreenRef.current.style.width = ww + 4 + "px";
            gamescreenRef.current.style.height = wh + 4 + "px";
            iframeRef.current.style.width = "100%";
            iframeRef.current.style.height = "100%";
        }

        iframeRef.current.style.borderRadius = "1rem";
        iframeRef.current.style.border =
            "3px solid var(--chakra-colors-gray-700)";

        btIFrameStyle.set(iframeRef.current.style);
    };

    const myObserver = new ResizeObserver(() => {
        onResize();
    });

    const onFullScreenChange = () => {
        if ((document as any).fullscreenElement) {
            btIsFullScreen.set(true);
        } else {
            btIsFullScreen.set(false);
        }
    };

    useEffect(() => {
        window.addEventListener("resize", onResize);
        document.addEventListener("fullscreenchange", onFullScreenChange);

        const gamepanels = btGamepanels.get();
        const gamepanel = gamepanels[props.shortid];
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

    const lastMessage = btGameState.get();
    const players = lastMessage?.players || {};
    const isSpectator = !(props.shortid in players);

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
                w="98%"
                h={"98%"}
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
                    alignSelf="center"
                >
                    <iframe
                        className="gamescreen"
                        ref={iframeRef}
                        onLoad={() => {
                            const gps = btGamepanels.get();
                            const gp = gps[props.shortid];

                            gp.iframe = iframeRef;
                            iframeRef.current!.style.visibility = "visible";
                            onResize();

                            setTimeout(() => {
                                GameStateService.updateGamePanel(props.shortid);
                            }, 100);
                        }}
                        src={
                            iframeRoute
                                ? iframeRoute
                                : "//localhost:3100/iframe.html"
                        }
                        sandbox="allow-scripts  allow-same-origin"
                    />
                </Box>
            </VStack>
        </VStack>
    );
}

function DisplayUserInfo(props: { shortid: string; iframeRef: any }) {
    const lastMessage = useBucket(btGameState);

    let isInGame = false;
    const players = lastMessage?.players;
    if (players && props.shortid in players) {
        isInGame = true;
    }

    const user = GamePanelService.getUserById(props.shortid);
    const isUserNext = GameStateService.validateNextUser(props.shortid);

    let color = "gray.400";
    if (isInGame) {
        color = "gray.200";
    }
    if (isUserNext) color = "gray.30";

    const fakePlayers = btFakePlayers.get() || {};
    const fakePlayerList = Object.keys(fakePlayers);

    return (
        <HStack
            px="3rem"
            width="100%"
            justifyContent={"center"}
            position="relative"
            alignItems={"center"}
            boxSizing="border-box"
            bgColor={"gray.950"}
        >
            <HStack
                px="2rem"
                onClick={() => {
                    const fps = btFakePlayers.get();
                    const fpList = Object.keys(fps || {}) || [];
                    const gps = btGamepanels.get();
                    const gamepanel = gps[props.shortid];
                    if (gamepanel) {
                        const primaryGamePanel = btPrimaryGamePanel.get();

                        if (gamepanel == primaryGamePanel && fpList.length < 7) {
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
                <Tooltip label={user.shortid} placement="bottom">
                    <Text
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
                <DisplayUserActions
                    shortid={props.shortid}
                    from={"gamepanel"}
                />
            </Box>
        </HStack>
    );
}

export default GamePanel;
