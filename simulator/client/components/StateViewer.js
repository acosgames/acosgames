import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, HStack, IconButton, Select, Text, Tooltip, useClipboard, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import ReactJson from 'react-json-view'

import { IoCopy } from '@react-icons';
import { useState } from 'react';
import { replayNext, replayPrev } from '../actions/game';
import GameStateService from '../services/GameStateService';
import DELTA from '../actions/delta';



export function StateViewer(props) {
    let [gameState] = fs.useWatch('gameState');
    let [scope, setScope] = useState('server');

    if (!gameState)
        return <></>

    let playerList = GameStateService.getPlayersArray();

    if (scope == 'server') {

    } else if (scope == 'spectator') {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);
        gameState = copy;
    }
    else {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);

        if (hiddenPlayers && hiddenPlayers[scope] && copy?.players[scope]) {
            copy.players[scope] = Object.assign({}, copy.players[scope], hiddenPlayers[scope]);
            copy.local = copy.players[scope];
            copy.private = { players: { [scope]: hiddenPlayers[scope] } };
        }

        gameState = copy;
    }

    return (
        <Box>
            {/* <ReactJson
                src={gameState}
                theme="isotope"
                enableClipboard="false"
                displayDataTypes="false"
                displayObjectSize="false"
            /> */}
            <HStack>
                <ReplayControls />
                <VStack px="2rem" w="100%">
                    <Text fontWeight={"bold"}>Scope</Text>
                    <Select
                        w="100%"
                        defaultValue={'server'}
                        onChange={(e) => {
                            setScope(e.target.value);
                        }}
                        fontSize="1.2rem"
                    >
                        <option fontSize="1rem" value="server">Server</option>
                        <option fontSize="1rem" value="spectator">Spectator</option>
                        {
                            playerList.map(p => (<option key={'scope-' + p.id} fontSize="1rem" value={p.id}>{p.name}</option>))
                        }
                    </Select>
                </VStack>
            </HStack>
            <Accordion allowMultiple={true} allowToggle={true} pt="2rem" defaultIndex={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                <ObjectViewer object={gameState?.action} title="action" bgColor="gray.500" />
                <ObjectViewer object={gameState?.events} title="events" />
                <ObjectViewer object={gameState?.state} title="state" />
                <ObjectViewer object={gameState?.players} title="players" />
                {(gameState?.teams &&
                    <ObjectViewer object={gameState?.teams} title="teams" />
                )}


                <ObjectViewer object={gameState?.timer} title="timer" />
                <ObjectViewer object={gameState?.next} title="next" />
                <ObjectViewer object={gameState?.room} title="room" />
            </Accordion>
        </Box>
    )
}

function ObjectViewer(props) {

    let object = props.object || {};
    let title = props.title;

    const { hasCopied, onCopy } = useClipboard(JSON.stringify(object, null, 4))

    return (
        <AccordionItem defaultValue={true} bgColor={props.bgColor || "gray.900"}>
            <AccordionButton height="2rem" lineHeight={'2rem'} px="1rem">
                <HStack flex='1' textAlign='left'>
                    <Text w="100%" fontSize="1.4rem" >{title}</Text>

                </HStack>
                <AccordionIcon />
            </AccordionButton>

            <AccordionPanel bgColor={"rgb(21, 21, 21)"} position="relative">
                <HStack position="absolute" top="0" right="0" w="100%" justifyContent={'flex-end'} height="4rem">
                    {hasCopied && (<Text as="span" fontSize="xxs">Copied!</Text>)}
                    <IconButton
                        fontSize={'1.6rem'}
                        color="gray.100"
                        _hover={{ color: "gray.300" }}
                        _active={{ color: "gray.500" }}
                        icon={<IoCopy color="gray.300" />}
                        // colorScheme={'white'}
                        isRound={true}
                        onClick={onCopy}
                    />

                </HStack>
                <VStack w="100%" alignItems={'flex-start'}>
                    <HStack w="100%" >

                    </HStack>
                    <Box px="1rem">
                        <ReactJson
                            src={object}
                            theme="chalk"
                            name={false}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                        // displayArrayKey={false}
                        />
                    </Box>

                </VStack>
            </AccordionPanel>
        </AccordionItem>
    )

}



export function ReplayControls(props) {

    let [gameStatus] = fs.useWatch('gameStatus');
    let [replayStats] = fs.useWatch('replayStats');
    let hasGameReplay = gameStatus != 'pregame';

    // if (!hasGameReplay)
    //     return <></>

    return (
        <VStack px="2rem" w="100%" h="100%" justifyContent={'center'} spacing="0">
            <Text display={props.hideTitle ? 'none' : 'inline-block'} as="span" fontWeight={'bold'}>Replay Control</Text>
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
        </VStack>
    )
}