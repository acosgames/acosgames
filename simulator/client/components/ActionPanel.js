import { Box, Button, HStack, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { leaveGame, newGame, startGame } from '../actions/game';


export function ActionPanel(props) {

    return <Box height="100%">
        <GameActions />
    </Box>
}




function GameActions(props) {


    let [socketUser] = fs.useWatch('socketUser');
    let [wsStatus] = fs.useWatch('wsStatus');
    let [gameStatus] = fs.useWatch('gameStatus');
    let [gamePanelLayout] = fs.useWatch('gamePanelLayout');

    // gamePanelLayout = gamePanelLayout || 'compact';

    if (wsStatus == 'disconnected') {
        return <></>
    }

    let isGameRunning = gameStatus != 'gameover' && gameStatus != 'none';
    let isPregame = gameStatus == 'pregame';
    let isInGame = gameStatus != 'pregame';

    return (
        <HStack height="100%" justifyItems={'center'} alignItems='center'>
            {/* 
            <HStack display={isGameRunning ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'red.800'}
                    onClick={leaveGame}>
                    {'Leave'}
                </Button>
            </HStack> */}
            {/* <HStack display={gameStatus == 'none' ? 'flex' : 'none'}>
                <Button onClick={() => {
                    joinGame()
                }}>
                    Join Game
                </Button>
            </HStack> */}
            <HStack display={isPregame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'green.800'}
                    onClick={startGame}>
                    {'Start Game'}
                </Button>


            </HStack>
            <HStack display={isInGame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'yellow.500'}
                    onClick={newGame}>
                    {'New Game'}
                </Button>

            </HStack>
            {/* <HStack display={isGameRunning ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'green.800'}
                    onClick={() => {
                        if (gamePanelLayout == 'compact') {
                            fs.set('gamePanelLayout', 'expanded');
                        } else {
                            fs.set('gamePanelLayout', 'compact');
                        }
                    }}>
                    Simulator Layout ({gamePanelLayout})
                </Button>

            </HStack> */}

        </HStack>
    )
}