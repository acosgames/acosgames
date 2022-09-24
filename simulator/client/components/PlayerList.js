import { Box, Button, HStack, Icon, IconButton, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { joinFakePlayer, joinGame, leaveFakePlayer, leaveGame, removeFakePlayer, spawnFakePlayers } from '../actions/game';
import { IoAddSharp, AiFillCloseCircle, ImEnter, IoPlaySharp, GoEye } from '@react-icons';
import GameStateService from '../services/GameStateService';
import GamePanelService from '../services/GamePanelService';


export function DisplayGamePlayers(props) {

    let [gameState] = fs.useWatch('gameState');

    let playerList = GameStateService.getPlayersArray();
    if (playerList.length == 0)
        return <></>

    const renderPlayers = () => {

        playerList.sort((a, b) => {
            if (a?.rank && b?.rank)
                return b.rank - a.rank;
            if (a?.score && b?.score)
                return b.score - a.score;

            return a.name.localCompare(b.name)
        });

        let elems = [];
        for (const player of playerList) {

            elems.push(

                <Tr pb="2rem">
                    <Td>
                        <Text display={typeof player?.rank !== 'undefined' ? 'inline-block' : 'none'}>{player.rank})</Text>
                    </Td>
                    <Td>
                        <Text>{player.name}</Text>
                    </Td>
                    <Td>
                        <Text display={typeof player?.score !== 'undefined' ? 'inline-block' : 'none'}>{player.score}</Text>
                    </Td>
                    <Td>
                        <DisplayUserActions id={player.id} />
                    </Td>
                </Tr>
            )
        }
        return elems;
    }

    return (

        <VStack>
            <Text fontWeight='bold'>In-Game Players</Text>
            <Table variant='simple' width="100%">
                <Thead>
                    <Tr>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem" isNumeric>Rank</Th>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem" >Player</Th>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem">Score</Th>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem">Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {renderPlayers()}
                </Tbody>
            </Table>


        </VStack>
    )

}

export function DisplayUserActions(props) {

    let [gameState] = fs.useWatch('gameState');

    let user = GamePanelService.getUserById(props.id);
    let isFakePlayer = 'clientid' in user;

    let player = GameStateService.getPlayer(props.id);
    let isInRoom = player != null
    let hasVacancy = GameStateService.hasVacancy();

    let isGameActive = gameState?.room?.status != 'gameover';

    let isJoinAllowed = !isInRoom && hasVacancy;
    let isLeaveAllowed = isInRoom;

    if (!isGameActive)
        return <></>

    return (
        <HStack>
            <Button
                display={isJoinAllowed ? 'block' : 'none'}
                fontSize={'xxs'}
                bgColor={'green.500'}
                height={'1.4rem'}
                lineHeight='1.4rem'
                onClick={() => {
                    if (isFakePlayer) {
                        let fakePlayer = GamePanelService.getUserById(props.id);
                        joinFakePlayer(fakePlayer);
                        return;
                    }
                    joinGame();
                }}
            >
                Join
            </Button>

            <Button
                display={isLeaveAllowed ? 'block' : 'none'}
                fontSize={'xxs'}
                height={'1.4rem'}
                lineHeight='1.4rem'
                bgColor={'red.500'}
                onClick={() => {
                    if (isFakePlayer) {
                        let fakePlayer = GamePanelService.getUserById(props.id);
                        leaveFakePlayer(fakePlayer);
                        return;
                    }
                    leaveGame();
                }}
            >
                Leave
            </Button>
        </HStack>
    )
}

export function DisplayFakePlayers(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');
    let [gameStatus] = fs.useWatch('gameStatus');

    let [wsStatus] = fs.useWatch('wsStatus');
    if (wsStatus == 'disconnected') {
        return <></>
    }

    fakePlayers = fakePlayers || {};
    let fakePlayerIds = Object.keys(fakePlayers);
    if (fakePlayerIds.length == 0)
        return <></>

    const renderFakePlayers = () => {

        let players = GameStateService.getPlayers();
        let elems = [];
        for (const shortid in fakePlayers) {
            let fakePlayer = fakePlayers[shortid];

            let isInGame = shortid in players;
            if (isInGame)
                continue;

            elems.push(
                <HStack key={'fakeplayer-' + shortid}>
                    <Text fontSize="1.5rem" width="70%">{fakePlayer.name}</Text>
                    <DisplayUserActions id={shortid} />
                    {/* <IconButton
                        fontSize={'2rem'}
                        colorScheme={'clear'}
                        icon={<ImEnter color="gray.300" />}
                        onClick={() => {
                            joinFakePlayer(fakePlayer);
                        }}
                    >
                        Join Game
                    </IconButton> */}
                    <IconButton
                        fontSize={'2rem'}
                        colorScheme={'clear'}
                        icon={<AiFillCloseCircle color="gray.300" />}
                        onClick={() => {
                            removeFakePlayer(fakePlayer);
                        }}
                    >
                        Remove Fake Player
                    </IconButton>
                </HStack>
            )
        }

        return elems;
    }

    return (
        <VStack pt="2rem">
            <Text fontWeight='bold'>Fake Players</Text>
            {renderFakePlayers()}
            <Box pt="2rem">
                <Button
                    leftIcon={<IoAddSharp color="white" />}
                    fontSize={'xxs'}
                    bgColor={'teal.700'}
                    onClick={() => {
                        spawnFakePlayers();
                    }}>
                    Add Fake Player
                </Button>
            </Box>
        </VStack>
    )
}