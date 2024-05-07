import {
    Box,
    chakra,
    HStack,
    Icon,
    Text,
    Tooltip,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import fs from "flatstore";
import { useEffect, useRef, useState } from "react";
import Connection from "./Connection.jsx";
import GamePanel from "./GamePanel.jsx";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

fs.set("gamePanelLayout", "compact");

import { GoEye } from "react-icons/go";
import { IoPlaySharp } from "react-icons/io5";
import GameStateService from "../services/GameStateService";
function GamePanelList(props) {
    let [fakePlayers] = fs.useWatch("fakePlayers");
    let [primaryGamePanel] = fs.useWatch("primaryGamePanel");
    let [layout] = fs.useWatch("gamePanelLayout");
    let [gamepanels] = fs.useWatch("gamepanels");
    // let primaryGamePanel = fs.get('primaryGamePanel');
    const gamePanelListRef = useRef();

    let [width, setWidth] = useState(200);
    let [height, setHeight] = useState(200);

    useEffect(() => {
        if (!gamePanelListRef?.current) return;

        let w = gamePanelListRef.current.offsetWidth;
        let h = gamePanelListRef.current.offsetHeight;
        setWidth(w);
        setHeight(h);
    });

    const renderGamePanels = () => {
        let elems = [];
        let cnt = -1;

        // if (!gamePanelListRef?.current)
        //     return;

        // let layout = fs.get('gamePanelLayout');

        // let width = gamePanelListRef.current.offsetWidth;
        // let height = gamePanelListRef.current.offsetHeight;
        let panelWidth = width;
        let panelHeight = height;

        if (fakePlayers) {
            let fakePlayerCount = Object.keys(fakePlayers).length;
            if (fakePlayerCount == 0) {
                panelWidth = 100;
                panelHeight = 100;
            } else if (fakePlayerCount < 2) {
                panelWidth = 50;
                panelHeight = 100;
            } else if (fakePlayerCount < 3) {
                panelWidth = 33;
                panelHeight = 100;
            } else if (fakePlayerCount < 4) {
                panelWidth = 25;
                panelHeight = 100;
            } else if (fakePlayerCount < 8) {
                panelWidth = 25;
                panelHeight = 50;
            } else {
                panelWidth = 12.5; //
                panelHeight = 33;
            }
        } else {
            panelWidth = 100;
            panelHeight = 100;
        }

        let lastMessage = fs.get("gameState");
        let gamepanels = fs.get("gamepanels");

        for (const id in gamepanels) {
            let gamepanel = gamepanels[id];

            let user = fakePlayers && fakePlayers[id];
            if (!user) {
                user = fs.get("socketUser");
                if (!user) continue;
            }

            let isPrimary = gamepanel == primaryGamePanel;
            if (!isPrimary) cnt++;

            let isInGame = user.id in (lastMessage?.players || {});

            if (layout == "expanded") {
                elems.push(
                    <ExpandedLayout
                        key={"gamepanel-" + id}
                        id={id}
                        name={user.name}
                        isPrimary={isPrimary}
                        isInGame={isInGame}
                        cnt={cnt}
                    />
                );
            } else if (layout == "compact") {
                elems.push(
                    <CompactLayout
                        key={"gamepanel-" + id}
                        id={id}
                        name={user.name}
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

    const ChakraSimpleBar = chakra(SimpleBar);

    return (
        <Box
            w="100%"
            h="100%"
            position="relative"
            ref={gamePanelListRef}
            flex="1"
            overflow="hidden"
        >
            {/* <ChakraSimpleBar
                boxSizing='border-box'
                className="main-scrollbars"
                style={{
                    width: '100%',
                    position: 'absolute',
                    inset: '0px',

                    // height: '100%', 
                    // flex: '1',
                    overflow: 'hidden scroll', boxSizing: 'border-box',
                }}> */}
            {renderGamePanels()}
            {/* </ChakraSimpleBar> */}
            <Connection />
        </Box>
    );
}

const onClickOverlay = (e, id) => {
    let gamepanels = fs.get("gamepanels");
    let gamepanel = gamepanels[id];
    if (gamepanel) {
        fs.set("primaryGamePanel", gamepanel);
    }
    return false;
};

function CompactLayout(props) {
    let gamepanels = fs.get("gamepanels") || {};
    let panelCount = Object.keys(gamepanels)?.length;
    return (
        <Box
            w={props.panelWidth + "%"}
            h={props.panelHeight + "%"}
            display={"inline-block"}
        >
            <VStack
                //onClick={(e) => { onClickOverlay(e, props.id) }}

                spacing="0"
                w="100%"
                h="100%"
                // pr="0.4rem"
            >
                {/* {panelCount > 1 && */}

                {/* } */}
                <Box height="3rem" w="100%"></Box>

                <GamePanel id={props.id} />
            </VStack>
        </Box>
    );
}

function ExpandedLayout(props) {
    return (
        <VStack
            // onClick={(e) => { onClickOverlay(e, props.id) }}
            display={!props.isPrimary ? "none" : "flex"}
            spacing="0"
            w={"100%"}
            h={"calc(100% - 3rem)"}
            position={"absolute"}
            left={"0"}
            top={"3rem"}
        >
            <GamePanel id={props.id} />
        </VStack>
    );
}

export default GamePanelList;