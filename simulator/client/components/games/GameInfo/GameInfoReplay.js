import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { downloadGameReplay, findGameReplays } from "../../../actions/notused/game";
import EmbeddedGamePanel from "../GameDisplay/EmbeddedGamePanel";
import fs from 'flatstore';
import { replayNextIndex, replayPrevIndex, sendPauseMessage, sendUnpauseMessage } from "../../../actions/notused/connection";
import { findGamePanelByRoom } from "../../../actions/notused/room";


function GameInfoReplay(props) {

    let game_slug = props.game_slug;
    let [room_slug] = fs.useWatch('replay/' + game_slug);

    useEffect(() => {
        if (!game_slug)
            return;

        findGameReplays(game_slug);

    }, [])


    if (!room_slug) {
        return <></>
    }

    // let randomReplay = props.replays[Math.floor(Math.random() * props.replays.length)];

    // if (!replay) {
    //     return <></>
    // }

    return (
        <Box width="30rem" height="30rem" position="relative">
            <VStack>
                <EmbeddedGamePanel room_slug={room_slug} />
                <ReplayControls room_slug={room_slug} />
            </VStack>

        </Box>
    )
}

function ReplayControls(props) {


    let [paused, setPaused] = useState(false);
    // let [room_slug] = fs.useWatch('replay/' + game_slug);

    // let gamepanel = findGamePanelByRoom(props.room_slug);

    return (
        <Box>
            <HStack>
                <Button onClick={() => {
                    replayPrevIndex(props.room_slug);
                }}>Prev</Button>
                <Button onClick={() => {
                    if (paused)
                        sendUnpauseMessage(props.room_slug);
                    else
                        sendPauseMessage(props.room_slug);
                    setPaused(!paused);
                }}>{paused ? 'Play' : 'Pause'}</Button>
                <Button onClick={() => {
                    replayNextIndex(props.room_slug);
                }}>Next</Button>
            </HStack>
        </Box>
    )
}



// let onCustomWatched = ownProps => {
//     return ['replays/' + ownProps.game_slug, 'replay/' + ownProps.game_slug];
// };
// let onCustomProps = (key, value, store, ownProps) => {
//     if (key == ('replays/' + ownProps.game_slug))
//         return { replays: value }
//     if (key == ('replay/' + ownProps.game_slug))
//         return { replay: value }
//     return {};
// };

export default GameInfoReplay;