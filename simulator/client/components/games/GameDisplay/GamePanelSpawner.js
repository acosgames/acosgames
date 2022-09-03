import { Box, Portal } from "@chakra-ui/react";
import fs from "flatstore"
// import Connection from "../Connection";
import GamePanel from "../../GamePanel";

function GamePanelSpawner(props) {


    const renderGamePanels = () => {
        let gamepanels = fs.get('gamepanels');

        if (!gamepanels) return <></>

        let panelElements = [];
        for (var i = 0; i < gamepanels.length; i++) {
            let gamepanel = gamepanels[i];

            //let's not show gamepanels that are available to reserve 
            if (gamepanel.available)
                continue;

            panelElements.push((

                <GamePanel key={'gamepanel-' + gamepanel.id} id={gamepanel.id} />

            ))
        }

        return panelElements;
    }

    return (
        <>
            {renderGamePanels()}
            {/* <Connection></Connection> */}
        </>
    )

}

export default fs.connect(['rooms'])(GamePanelSpawner);
