import { Box, HStack, VStack } from "@chakra-ui/react";
import fs from 'flatstore';
import { useEffect } from "react";
import { createGamePanel } from "../actions/gamepanel";
import Connection from "./Connection";
import GamePanel from "./GamePanel";


function GamePanelList(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');
    let [primaryGamePanel] = fs.useWatch('primaryGamePanel');

    let gamepanels = fs.get('gamepanels');


    useEffect(() => {


        // addRoom(defaultRoom);

    }, [])




    const renderGamePanels = () => {

        let elems = [];
        for (const id in gamepanels) {
            let gamepanel = gamepanels[id];

            if (gamepanel == primaryGamePanel)
                continue;

            let user = fakePlayers[id];
            if (!user) {
                user = fs.get('socketUser');
                if (!user)
                    continue;
            }

            elems.push(
                <GamePanel id={id} />
            )
        }

        return elems;
    }

    const renderPrimaryGamePanel = () => {

        if (!primaryGamePanel)
            return <></>
        return <GamePanel id={primaryGamePanel.id} />

    }


    return (
        <HStack>
            <Box>
                {renderPrimaryGamePanel()}
            </Box>
            <VStack>
                {renderGamePanels()}
            </VStack>

            <Connection />
        </HStack>
    )


}

export default GamePanelList;