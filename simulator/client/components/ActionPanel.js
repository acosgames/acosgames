import { Box, Button, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { leaveGame, newGame, replayNext, replayPrev, startGame } from '../actions/game';


export function ActionPanel(props) {

    return <Box height="100%">
        <GameActionsCompact />
    </Box>
}




function GameActionsCompact(props) {


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
            <ReplayControls />
            <HStack display={isInGame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'blacks.600'}
                    onClick={newGame}>
                    {isGameRunning || isGameOver ? 'Reset Game' : 'New Game'}
                </Button>

            </HStack>
            <HStack display={isPregame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'green.500'}
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

export function GameActionsExpanded(props) {

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
        <VStack height="100%" justifyItems={'center'} alignItems='center'>

            <HStack display={isInGame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'blacks.600'}
                    onClick={newGame}>
                    {isGameRunning || isGameOver ? 'Reset Game' : 'New Game'}
                </Button>

            </HStack>
            <HStack display={isPregame ? 'flex' : 'none'}>
                <Button
                    fontSize={'xxs'}
                    bgColor={'green.500'}
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

        </VStack>
    )
}


export function ReplayControls(props) {

    let [gameStatus] = fs.useWatch('gameStatus');
    let [replayStats] = fs.useWatch('replayStats');
    let hasGameReplay = gameStatus != 'none' && gameStatus != 'pregame';

    if (!hasGameReplay)
        return <></>

    return (
        <Box w="100%">
            <HStack justifyContent={'center'}>
                <Tooltip label={'Previous State'}>
                    <Button
                        fontSize={'xxs'}
                        bgColor={'gray.500'}
                        onClick={() => {
                            replayPrev();
                        }}>
                        &lt;
                    </Button>
                </Tooltip>
                <Text as="span">{replayStats.position}</Text>
                <Text as="span">/</Text>
                <Text as="span">{replayStats.total}</Text>
                <Tooltip label={'Next State'}>
                    <Button
                        fontSize={'xxs'}
                        bgColor={'gray.500'}
                        onClick={() => {
                            replayNext();
                        }}>
                        &gt;
                    </Button>
                </Tooltip>
            </HStack>
        </Box>
    )
}