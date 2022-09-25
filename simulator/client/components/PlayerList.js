import { Box, Button, Divider, HStack, Icon, IconButton, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import { joinFakePlayer, joinGame, leaveFakePlayer, leaveGame, removeFakePlayer, spawnFakePlayers } from '../actions/game';
import { IoAddSharp, FaChevronRight, AiFillCloseCircle, ImEnter, IoPlaySharp, GoEye } from '@react-icons';
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

            let isUserNext = GameStateService.validateNextUser(player.id);

            elems.push(

                <Tr key={'ingameplayers-' + player.id} pb="2rem" bgColor={"gray.900"} >
                    <Td >
                        <Text display={typeof player?.rank !== 'undefined' ? 'inline-block' : 'none'}>{player.rank}</Text>
                    </Td>
                    <Td>
                        <HStack>

                            <Tooltip label={"Is Next"} placement="top">
                                <Box>
                                    <Icon display={isUserNext ? 'inline-block' : 'none'} width="1rem" height="1rem" color="white" as={FaChevronRight} />
                                </Box>
                            </Tooltip>

                            <Tooltip label={player.id} placement="top">
                                <Text>

                                    {player.name}
                                </Text>
                            </Tooltip>
                        </HStack>
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

        <VStack pt="4rem" pb="4rem">
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
                bgColor={'green.800'}
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
                bgColor={'red.800'}
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

export function DisplayMyPlayers(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');
    let [gameStatus] = fs.useWatch('gameStatus');

    let [wsStatus] = fs.useWatch('wsStatus');
    if (wsStatus == 'disconnected') {
        return <></>
    }

    fakePlayers = fakePlayers || {};
    let fakePlayerIds = Object.keys(fakePlayers);

    const renderMyPlayers = () => {

        let players = GameStateService.getPlayers();
        let elems = [];


        // if (fakePlayerIds.length == 0)
        //     return elems;

        let myplayers = [];
        let socketUser = fs.get('socketUser');
        myplayers.push(socketUser);

        for (const shortid in fakePlayers) {
            let fakePlayer = fakePlayers[shortid];
            myplayers.push(fakePlayer);
        }

        for (const p of myplayers) {
            // let fakePlayer = fakePlayers[shortid];
            if (!p || !p.id)
                continue;

            let isInGame = p.id in players;
            // if (isInGame)
            //     continue;

            let isUserNext = GameStateService.validateNextUser(p.id);

            let color = 'white';
            if (!isInGame || !isUserNext)
                color = 'gray.400'

            elems.push(
                <Tr bgColor="gray.900" key={'myplayers-' + p.id}>

                    <Td>
                        <HStack alignItems={'center'} justifyContent='flex-start'>
                            <Tooltip label={isInGame ? 'In game' : 'Spectator'} placement="top">
                                <Text as='span' lineHeight="2.1rem" h="2.1rem">
                                    <Icon color={color} as={isInGame ? IoPlaySharp : GoEye} w="1.4rem" h="1.4rem" />
                                </Text>
                            </Tooltip>
                            <Tooltip label={p.id} placement="top">
                                <Text lineHeight="2.1rem" h="2.1rem" fontSize="1.5rem">{p.name}</Text>
                            </Tooltip>
                        </HStack>
                    </Td>
                    <Td>
                        <HStack justifyContent={'flex-end'}>

                            <DisplayUserActions id={p.id} />

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
                                display={p.clientid ? 'block' : 'none'}
                                fontSize={'2rem'}
                                colorScheme={'clear'}
                                icon={<AiFillCloseCircle color="gray.300" />}
                                onClick={() => {
                                    if (p.clientid)
                                        removeFakePlayer(p);
                                }}
                            >
                                Remove Fake Player
                            </IconButton>
                        </HStack>
                    </Td>
                </Tr>
            )
        }

        return elems;
    }

    return (
        <VStack pt="4rem">
            <Text fontWeight='bold'>My Players</Text>

            <Table variant='simple' width="100%">
                {/* <Thead>
                    <Tr>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem" >Player</Th>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem">Actions</Th>
                    </Tr>
                </Thead> */}
                <Tbody>
                    {renderMyPlayers()}
                </Tbody>
            </Table>



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