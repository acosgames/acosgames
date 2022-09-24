import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { leaveGame, newGame, replayNext, replayPrev, startGame } from '../actions/game';


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
    let isInGame = true;// gameStatus != 'gamestart';
    let isGameOver = gameStatus == 'gameover';

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
            <ReplayControls gameStatus={gameStatus} />
            <HStack display={isInGame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'gray.900'}
                    onClick={newGame}>
                    {isGameRunning || isGameOver ? 'Reset Game' : 'New Game'}
                </Button>

            </HStack>
            <HStack display={isPregame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'green.300'}
                    onClick={startGame}>
                    {'Start Game'}
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


function ReplayControls(props) {

    let [replayStats] = fs.useWatch('replayStats');
    let hasGameReplay = props.gameStatus != 'none' && props.gameStatus != 'pregame';

    if (!hasGameReplay)
        return <></>

    return (
        <Box>
            <HStack>
                <Button
                    fontSize={'xxs'}
                    bgColor={'gray.500'}
                    onClick={() => {
                        replayPrev();
                    }}>
                    &lt;
                </Button>
                <Text as="span">{replayStats.position}</Text>
                <Text as="span">/</Text>
                <Text as="span">{replayStats.total}</Text>
                <Button
                    fontSize={'xxs'}
                    bgColor={'gray.500'}
                    onClick={() => {
                        replayNext();
                    }}>
                    &gt;
                </Button>
            </HStack>
        </Box>
    )
}