import {
    Box,
    chakra,
    HStack,
    Icon,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Connection from "./Connection";
import GamePanel from "./GamePanel";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { GoEye } from "react-icons/go";
import { IoPlaySharp } from "react-icons/io5";
import GameStateService from "../services/GameStateService";
import { useBucket } from "react-bucketjs";
import {
    btFakePlayers,
    btGamepanelLayout,
    btGamepanels,
    btGameSettings,
    btGameState,
    btPrimaryGamePanel,
    btSocketUser,
} from "../actions/buckets";

function GamePanelList() {
    const fakePlayers = useBucket(btFakePlayers);
    const primaryGamePanel = useBucket(btPrimaryGamePanel);
    const layout = useBucket(btGamepanelLayout);
    const gamepanels = useBucket(btGamepanels);
    const gamePanelListRef = useRef<any>();

    const [width, setWidth] = useState(200);
    const [height, setHeight] = useState(200);

    useEffect(() => {
        if (!gamePanelListRef?.current) return;

        const w = gamePanelListRef.current.offsetWidth;
        const h = gamePanelListRef.current.offsetHeight;
        setWidth(w);
        setHeight(h);
    });

    const renderGamePanels = () => {
        const elems: React.ReactNode[] = [];
        let cnt = -1;

        let panelWidth = width;
        let panelHeight = height;

        const gameSettings = btGameSettings.get();

        const isWide =
            gameSettings.screentype != 1 &&
            gameSettings.resow > gameSettings.resoh;

        if (fakePlayers) {
            const fakePlayerCount = Object.keys(fakePlayers).length;

            if (isWide) {
                if (fakePlayerCount == 0) {
                    panelWidth = 100; panelHeight = 100;
                } else if (fakePlayerCount < 2) {
                    panelWidth = 50; panelHeight = 100;
                } else if (fakePlayerCount < 3) {
                    panelWidth = 33; panelHeight = 100;
                } else if (fakePlayerCount < 4) {
                    panelWidth = 50; panelHeight = 50;
                } else if (fakePlayerCount < 6) {
                    panelWidth = 33; panelHeight = 50;
                } else if (fakePlayerCount < 8) {
                    panelWidth = 25; panelHeight = 50;
                } else if (fakePlayerCount < 10) {
                    panelWidth = 20; panelHeight = 50;
                } else if (fakePlayerCount < 15) {
                    panelWidth = 20; panelHeight = 33;
                } else {
                    panelWidth = 12.5; panelHeight = 33;
                }
            } else {
                if (fakePlayerCount == 0) {
                    panelWidth = 100; panelHeight = 100;
                } else if (fakePlayerCount < 2) {
                    panelWidth = 50; panelHeight = 100;
                } else if (fakePlayerCount < 3) {
                    panelWidth = 33; panelHeight = 100;
                } else if (fakePlayerCount < 4) {
                    panelWidth = 25; panelHeight = 100;
                } else if (fakePlayerCount < 5) {
                    panelWidth = 19.9; panelHeight = 100;
                } else if (fakePlayerCount < 10) {
                    panelWidth = 20; panelHeight = 50;
                } else if (fakePlayerCount < 12) {
                    panelWidth = 16; panelHeight = 50;
                } else if (fakePlayerCount < 16) {
                    panelWidth = 12.5; panelHeight = 50;
                } else {
                    panelWidth = 12.5; panelHeight = 33;
                }
            }
        } else {
            panelWidth = 100;
            panelHeight = 100;
        }

        const lastMessage = btGameState.get();
        const gp = btGamepanels.get();

        for (const shortid in gp) {
            const gamepanel = gp[shortid];

            let user: any = fakePlayers && fakePlayers[shortid];
            if (!user) {
                user = btSocketUser.get();
                if (!user) continue;
            }

            const isPrimary = gamepanel == primaryGamePanel;
            if (!isPrimary) cnt++;

            const isInGame = user.shortid in (lastMessage?.players || {});

            if (layout == "expanded") {
                elems.push(
                    <ExpandedLayout
                        key={"gamepaneld-" + shortid}
                        shortid={shortid}
                        displayname={user.displayname}
                        isPrimary={isPrimary}
                        isInGame={isInGame}
                        cnt={cnt}
                    />
                );
            } else if (layout == "compact") {
                elems.push(
                    <CompactLayout
                        key={"gamepanel-" + shortid}
                        shortid={shortid}
                        displayname={user.displayname}
                        isPrimary={isPrimary}
                        isInGame={isInGame}
                        panelWidth={panelWidth}
                        panelHeight={panelHeight}
                    />
                );
            }
        }

        return elems;
    };

    if (!gamepanels || Object.keys(gamepanels).length == 0) {
        return <></>;
    }

    return (
        <Box
            w="100%"
            h="100%"
            position="relative"
            ref={gamePanelListRef}
            flex="1"
            overflow="hidden"
        >
            {renderGamePanels()}
            <Connection />
        </Box>
    );
}

function CompactLayout(props: {
    shortid: string;
    displayname: string;
    isPrimary: boolean;
    isInGame: boolean;
    panelWidth: number;
    panelHeight: number;
}) {
    return (
        <Box
            w={props.panelWidth + "%"}
            h={props.panelHeight + "%"}
            display={"inline-block"}
        >
            <VStack
                spacing="0"
                w="99%"
                h="99%"
            >
                <GamePanel shortid={props.shortid} />
            </VStack>
        </Box>
    );
}

function ExpandedLayout(props: {
    shortid: string;
    displayname: string;
    isPrimary: boolean;
    isInGame: boolean;
    cnt: number;
}) {
    return (
        <VStack
            display={!props.isPrimary ? "none" : "flex"}
            spacing="2rem"
            w={"100%"}
            h={"100%"}
            position={"absolute"}
            left={"0"}
            top={"0"}
        >
            <GamePanel shortid={props.shortid} />
        </VStack>
    );
}

export default GamePanelList;
