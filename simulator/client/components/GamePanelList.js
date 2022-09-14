import { Box, HStack, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import fs from 'flatstore';
import { useEffect, useRef } from "react";
import { createGamePanel } from "../actions/gamepanel";
import Connection from "./Connection";
import GamePanel from "./GamePanel";


function GamePanelList(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');
    let [primaryGamePanel] = fs.useWatch('primaryGamePanel');
    let gamepanels = fs.get('gamepanels');

    const gamePanelListRef = useRef();

    useEffect(() => {

    }, [])



    const renderGamePanels = () => {
        let elems = [];
        let cnt = -1;

        if (!gamePanelListRef?.current)
            return;

        let layout = fs.get('gamePanelLayout');

        let width = gamePanelListRef.current.offsetWidth;
        let height = gamePanelListRef.current.offsetHeight;
        let panelWidth = width;
        let panelHeight = height;

        if (fakePlayers) {
            let fakePlayerCount = Object.keys(fakePlayers).length;
            if (fakePlayerCount < 4) {
                panelWidth = 100.0 / (fakePlayerCount + 1)
                panelHeight = 100;
            } else if (fakePlayerCount < 8) {
                panelWidth = 25;
                panelHeight = 50;
            }
            else {
                panelWidth = 12.5;//
                panelHeight = 33;
            }

        }
        else {
            panelWidth = 100;
            panelHeight = 100;
        }

        for (const id in gamepanels) {
            let gamepanel = gamepanels[id];

            let user = fakePlayers && fakePlayers[id];
            if (!user) {
                user = fs.get('socketUser');
                if (!user)
                    continue;
            }

            let isPrimary = gamepanel == primaryGamePanel;
            if (!isPrimary)
                cnt++;

            if (layout == 'expanded') {
                elems.push(
                    <ExpandedLayout key={'gamepanel-' + id} id={id} name={user.name} isPrimary={isPrimary} />
                )
            }
            else if (layout == 'compact') {
                elems.push(
                    <CompactLayout key={'gamepanel-' + id} id={id} name={user.name} isPrimary={isPrimary} panelWidth={panelWidth} panelHeight={panelHeight} />
                )
            }

        }

        return elems;
    }

    return (
        <Box w="100%" h="100%" position="relative" ref={gamePanelListRef}>
            {renderGamePanels()}
            <Connection />
        </Box>
    )
}

const onClickOverlay = (e, id) => {
    let gamepanels = fs.get('gamepanels');
    let gamepanel = gamepanels[id];
    if (gamepanel) {
        fs.set('primaryGamePanel', gamepanel);
    }
    return false;
}

function CompactLayout(props) {

    let gamepanels = fs.get('gamepanels') || {};
    let panelCount = Object.keys(gamepanels)?.length;
    return (
        <Box w={props.panelWidth + '%'}
            h={props.panelHeight + '%'}

            display={'inline-block'} >
            <VStack
                onClick={(e) => { onClickOverlay(e, props.id) }}

                spacing="0"
                w="100%"
                h="100%"
                pr="0.4rem"
            >
                {panelCount > 1 &&
                    <Box display={'block'}>
                        <Text
                            cursor={'pointer'}
                            display="inline-block"
                            fontSize="xs"
                            fontWeight="light">
                            {props.name}
                        </Text>
                        &nbsp;
                        <Text
                            cursor={'pointer'}
                            display="inline-block"
                            fontSize="xxs"
                            color="gray.300"
                            fontWeight="light">
                            [{props.id}]
                        </Text>
                    </Box>
                }

                < GamePanel id={props.id} />
            </VStack>
        </Box >
    )
}

function ExpandedLayout(props) {

    return (
        <VStack
            onClick={(e) => { onClickOverlay(e, props.id) }}

            spacing="0"
            w={props.isPrimary ? 'calc(100% - 30rem)' : "20rem"}
            h={isPrimary ? 'calc(100vh - 5rem)' : "20rem"}
            position={"absolute"}
            right={isPrimary ? 'auto' : '0'}
            left={isPrimary ? '0' : 'auto'}
            top={isPrimary ? '0' : (cnt * 20) + 'rem'}
        >
            <Box>
                <Text
                    cursor={'pointer'}
                    display="inline-block"
                    fontSize="xxs"
                    fontWeight="light">
                    {props.name}
                </Text>
                <Text
                    cursor={'pointer'}
                    display="inline-block"
                    fontSize="xxs"
                    color="gray.500"
                    fontWeight="light">
                    [{props.id}]
                </Text>
            </Box>
            < GamePanel id={props.id} />
        </VStack>
    )
}

export default GamePanelList;