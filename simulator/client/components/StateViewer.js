import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, HStack, IconButton, Select, Text, Tooltip, useClipboard, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import ReactJson from 'react-json-view'

import { IoCopy } from '@react-icons';
import { useState } from 'react';
import { replayNext, replayPrev } from '../actions/game';
import GameStateService from '../services/GameStateService';
import { delta } from '../util/delta';
const DELTA = require('../../shared/delta');



export function StateViewer(props) {
    let [gameState] = fs.useWatch('gameState');
    let [scope, setScope] = useState('server');

    if (!gameState)
        return <></>

    let playerList = GameStateService.getPlayersArray();
    let deltaEncoded = fs.get('deltaEncoded');

    if (scope == 'server') {
        let copy = GameStateService.getGameState();

        copy.private = {};
        copy.local = {};
        gameState = copy;
    } else if (scope == 'spectator') {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);
        copy.private = {};
        copy.local = {};
        gameState = copy;
        if (gameState?.action?.user?.id)
            gameState.action.user = gameState.action.user.id;



        if (gameState?.action && 'timeseq' in gameState.action)
            delete gameState.action.timeseq;

        if (gameState?.action && 'timeleft' in gameState.action)
            delete gameState.action.timeleft;

    }
    else if (scope == 'packet') {
        let delta = fs.copy('deltaState');
        delta.local = {};
        gameState = delta;
    }
    else {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);

        if (hiddenPlayers && hiddenPlayers[scope] && copy?.players[scope]) {
            copy.players[scope] = Object.assign({}, copy.players[scope], hiddenPlayers[scope]);

            copy.private = { players: { [scope]: hiddenPlayers[scope] } };
        }

        if (copy?.players[scope])
            copy.local = copy.players[scope];
        gameState = copy;

        if (gameState?.action?.user?.id)
            gameState.action.user = gameState.action.user.id;

        if (gameState?.action && 'timeseq' in gameState.action)
            delete gameState.action.timeseq;

        if (gameState?.action && 'timeleft' in gameState.action)
            delete gameState.action.timeleft;
    }

    return (
        <VStack width="100%">
            {/* <ReactJson
                src={gameState}
                theme="isotope"
                enableClipboard="false"
                displayDataTypes="false"
                displayObjectSize="false"
            /> */}
            <HStack py="0rem" width="100%">
                <ReplayControls />
                <VStack w="100%">
                    <Text fontWeight={"bold"} fontSize="xs">JSON Scope</Text>
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
                        <option fontSize="1rem" value="packet">Delta Packet</option>
                        {
                            playerList.map(p => (<option key={'scope-' + p.id} fontSize="1rem" value={p.id}>{p.name}</option>))
                        }
                    </Select>
                </VStack>
            </HStack>
            <HStack>
                <Text fontSize="xxs">Encoded Size: </Text>
                <Text fontSize="xs" fontWeight="bold">{deltaEncoded} </Text>
                <Text fontSize="xxs" fontWeight="bold">bytes</Text>
            </HStack>
            <Accordion allowMultiple={true} allowToggle={true} pt="2rem" pl="1rem" defaultIndex={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} w="100%">
                <ObjectViewer object={gameState?.action} title="action" bgColor="gray.700" />
                <ObjectViewer object={gameState?.events} title="events" bgColor="gray.500" />
                <ObjectViewer object={gameState?.state} title="state" bgColor="gray.500" />
                <ObjectViewer object={gameState?.players} title="players" bgColor="gray.500" />
                {(gameState?.teams &&
                    <ObjectViewer object={gameState?.teams} title="teams" bgColor="gray.500" />
                )}


                <ObjectViewer object={gameState?.timer} title="timer" bgColor="gray.500" />
                <ObjectViewer object={gameState?.next} title="next" bgColor="gray.500" />
                <ObjectViewer object={gameState?.room} title="room" bgColor="gray.500" />
                <ObjectViewer object={gameState?.local} title="local" bgColor="gray.500" />
            </Accordion>
        </VStack>
    )
}

function ObjectViewer(props) {

    let object = props.object || {};
    let title = props.title;

    const { hasCopied, onCopy } = useClipboard(JSON.stringify(object, null, 4))

    return (
        <AccordionItem defaultValue={true} bgColor={props.bgColor || "gray.900"} w="100%">
            <AccordionButton height="2rem" lineHeight={'2rem'} px="1rem">
                <HStack flex='1' textAlign='left'>
                    <Text w="100%" fontSize="1.4rem" >{title}</Text>

                </HStack>
                <AccordionIcon />
            </AccordionButton>

            <AccordionPanel bgColor={"rgb(21, 21, 21)"} position="relative">
                <HStack position="absolute" top="0" right="0" w="100%" justifyContent={'flex-end'} height="4rem">
                    {hasCopied && (<Text position="relative" zIndex={100} as="span" fontSize="xxs">Copied!</Text>)}
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
        <VStack w="100%" h="100%" justifyContent={'center'} spacing="0">
            <Text display={props.hideTitle ? 'none' : 'inline-block'} as="span" fontSize="xs" fontWeight={'bold'}>Replay Control</Text>
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