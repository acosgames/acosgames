
import { Box, Flex, HStack, Icon, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, withRouter } from 'react-router-dom';

import { AiOutlineDisconnect } from '@react-icons';

import { FaCheck } from '@react-icons';

import { getPrimaryGamePanel, getRoomStatus } from '../../../actions/notused/room';

function GameMessageOverlay(props) {

    // const params = useParams();
    // const location = useLocation();

    // console.log('params', params);
    // console.log('location', location);;

    // const game_slug = params.game_slug;
    // const mode = params.mode;
    // const room_slug = params.room_slug;

    let gamepanel = props.gamepanel;//getPrimaryGamePanel();

    if (!gamepanel)
        return <></>

    const room = gamepanel.room;
    const room_slug = room.room_slug;
    const game_slug = room.game_slug;
    const mode = room.mode;

    const [hide, setHide] = useState(false);

    let timeleft = fs.get('timeleft/' + gamepanel.id) || 0;
    timeleft = Math.ceil(timeleft / 1000);

    // let game = fs.get('games>' + game_slug) || {};
    let gamestate = gamepanel.gamestate;// fs.get('gamestate') || {};
    let state = gamestate?.state;
    let events = gamestate?.events;
    if (!state) {
        return <></>
    }

    let players = gamestate.players;
    const renderPlayers = () => {
        let elems = [];
        for (var key in players) {
            let player = players[key];

            elems.push(
                <HStack key={'waiting-' + key} spacing="0">
                    <Box display={player.ready ? 'flex' : 'none'} w="40px" justifyContent={'center'}>
                        <Icon as={FaCheck} color="green.400" />
                    </Box>
                    <Box display={player.ready ? 'none' : 'flex'} w="40px" justifyContent={'center'}>
                        <Spinner color='yellow.200' size="sm" />
                    </Box>
                    <Box w="150px">
                        <Text as="span" color={player.ready ? 'white' : 'gray.500'}>{player?.name || 'unknown'}</Text>
                    </Box>
                </HStack>
            )
        }

        return elems;
    }

    let message = null;

    let isPregame = state?.gamestatus == 'pregame';
    let isStarting = state?.gamestatus == 'starting';
    let isGamestart = state?.gamestatus == 'gamestart';
    let isGameover = state?.gamestatus == 'gameover' || events?.gameover;

    let roomStatus = getRoomStatus(room_slug);
    // if (isGamestart)
    //     return <></>

    if (roomStatus == 'NOSHOW') {
        message = <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
            <Text as="h3" fontSize="3xl">Not all players joined.</Text>
        </VStack>;
    }
    else if (roomStatus == 'GAMEOVER') {

        let local = fs.get('user');
        let localPlayer = players[local.shortid] || {};
        let isSoloGame = room.maxplayers == 1;
        let hasHighscore = isSoloGame || room.lbscore;
        let extra = <></>
        if (gamestate?.timer?.seq <= 2 && !isSoloGame) {
            extra = <Text as="h3" fontSize="3xl">Game Over. Players left early.</Text>
        }
        else if (!isSoloGame) {

            if (local && players) {


                let playerList = Object.keys(players);
                let bestRank = 100000;
                for (var i = 0; i < playerList.length; i++) {
                    let playerid = playerList[i];
                    let p = players[playerid];
                    if (p.rank < bestRank)
                        bestRank = p.rank;
                }
                let player = players[local.shortid] || {};
                let rank = player.rank;
                if (!Number.isInteger(rank))
                    rank = 10000;
                if (rank == bestRank) {
                    extra = <Text key="header-you-win" as="h3" fontSize="3xl">You Win</Text>
                } else {
                    extra = <Text key="header-new-you-lose" as="h3" fontSize="3xl">You Lose</Text>
                }
            }
        }
        else {
            extra = [
                <Text key="header-gameover" as="h3" fontSize={'3xl'}>Game Over</Text>
            ]

            let localPlayerHighscore = fs.get('localPlayerHighscore');

            if (localPlayerHighscore && localPlayerHighscore?.score < localPlayer.score) {
                extra.push(<Text key="header-new-high-score" as="h4" fontSize={'md'}>NEW High Score: {localPlayer.highscore}</Text>);
            }
            else
                extra.push(<Text key="header-high-score" as="h4" fontSize={'md'}>High Score: {localPlayer.highscore}</Text>)
        }


        message = <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
            {extra}
        </VStack>;
    }
    else if (roomStatus == 'ERROR') {
        message = <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
            <Text as="h4" fontSize="md">Error in Game</Text>
            <Text as="h3" fontSize="3xl">{events?.error}</Text>
        </VStack>;
    }
    else if ((isPregame && room.maxplayers > 1) || ((isStarting && room.maxplayers > 1) && timeleft > 4)) {
        message = <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
            <Text as="h4" fontSize="md">Waiting for players</Text>
            {renderPlayers()}

            <Text display={isStarting ? 'none' : 'block'} as="h3" fontSize="3xl">{timeleft}</Text>
        </VStack>
    }
    else if (isStarting && room.maxplayers > 1) {
        message = <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
            <Text as="h4" fontSize="md">Starting in </Text>
            <Text as="h3" fontSize="3xl">{timeleft > 0 ? timeleft : 'GO!'}</Text>
        </VStack>;
    }
    else if (isGamestart) {

        let ws = fs.get('wsConnected');
        if (!ws)
            message = (
                <VStack w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
                    <HStack>
                        <Icon as={AiOutlineDisconnect} fontSize="24px" color='red.400' />
                        <Text as="h4" fontSize="md">DISCONNECTED</Text>
                    </HStack>
                    <Text as="h3" fontSize="md">Reconnecting to server...</Text>
                </VStack>
            );
        else
            return <></>
    }
    else {
        return <></>
    }


    const onClickMessage = (e) => {

        // setHide(true);
    }


    return (
        // <Portal>
        <Box
            display={'block'}
            // w="200px" 
            bgColor={'gray.800'}
            borderRadius="6px"
            // height="150px"
            position="absolute"
            // bottom="0"
            // right="0"
            transform='translate(-50%, -50%)'
            left="50%"
            top="50%"
            color="gray.100"
            // borderRadius={'50%'}
            /* bring your own prefixes */
            p="1rem"
            zIndex={3}
            // transform="translate(0, 0)"
            filter={hide ? 'opacity(0)' : 'opacity(100%)'}
            transition={'filter 0.3s ease-in'}
            onClick={onClickMessage}
        >
            <Flex w="100%" h="100%" justifyContent={'center'} alignContent={'center'} alignItems={'center'}>
                {message}
            </Flex>
        </Box>
        // </Portal>
    )


}




export default (fs.connect(['gamestatusUpdated', 'timeleftUpdated', 'wsConnected'])(GameMessageOverlay));