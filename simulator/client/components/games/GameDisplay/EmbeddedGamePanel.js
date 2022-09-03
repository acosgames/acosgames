import { Box } from '@chakra-ui/react';
import fs from 'flatstore';
import { useEffect, useRef } from 'react';
import { findGamePanelByRoom, updateGamePanel } from '../../../actions/notused/room';


function EmbeddedGamePanel(props) {

    const embeddedRef = useRef();

    useEffect(() => {

    })

    useEffect(() => {

        if (props.room_slug) {
            let gamepanel = findGamePanelByRoom(props.room_slug);
            gamepanel.canvasRef = embeddedRef;
            updateGamePanel(gamepanel);
        }
    });

    return (
        <Box position="relative" w="300px" h="300px" p="0" m="0" ref={embeddedRef}>
        </Box>
    )
}

export default EmbeddedGamePanel;