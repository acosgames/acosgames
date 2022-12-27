import { Box, chakra, HStack, Image, Text, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { useRef } from 'react';



// import SimpleBar from 'simplebar-react';
// import 'simplebar-react/dist/simplebar.min.css';


// import { getGameModeName } from '../../util/helper'
// import { getPrimaryGamePanel, isNextTeam, isUserNext } from '../../actions/room';
import ScoreboardMulti from './ScoreboardMulti';
import ScoreboardSolo from './ScoreboardSolo';




export default function Scoreboard(props) {
    // const scrollRef = useRef();
    // let [room] = fs.useWatch('primary/room');
    // let [scoreboardExpanded] = fs.useWatch('scoreboardExpanded');
    // if (!room)
    // return <></>



    // const ChakraSimpleBar = chakra(SimpleBar)

    // let mode = Number.isInteger(room.mode) ? getGameModeName(room.mode) : room.mode;

    return (
        <VStack w="100%" spacing="0" justifyContent={'center'} alignItems="center" boxSizing='border-box' key="scoreboard-body" p="1rem">


            <VStack
                className="scoreboard-panel"
                // bgColor="gray.700"
                // borderRadius="2rem"
                bgColor="gray.1200"
                borderRadius="2rem"
                //border="2px solid"
                borderColor={'gray.175'}
                height="100%"
                width="100%"
                spacing={'1rem'}
                py="0.5rem"
                justifyContent={'flex-end'}
                key={'scoreboard-body-vstack'}
            >
                <VStack
                    // bgColor="gray.1000" 
                    // borderRadius={"2rem"} 
                    spacing="0"
                    w="100%">
                    <ScoreboardPlayers key={'scoreboard-player-list'} />
                </VStack>



            </VStack>

        </VStack>
    )
}

function ScoreboardPlayers(props) {

    let [gameSettings] = fs.useWatch('gameSettings');
    let [gameState] = fs.useWatch('gameState');
    let players = gameState.players;

    // let [players] = fs.useWatch('primary/players');
    //let [teams] = fs.useWatch('primary/teams');
    if (!players)
        return <></>

    // let gamepanel = getPrimaryGamePanel();
    // if (!gamepanel)
    //     return <></>

    let teams = gameState?.teams || {};// gamepanel?.gamestate?.teams || {};


    if (gameSettings?.maxplayers == 1) {
        // return <></>
        return <ScoreboardSolo players={players} />
    }

    return <ScoreboardMulti players={players} teams={teams} />
}
