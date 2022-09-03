import { Box, IconButton, VStack, Text, Icon, HStack, Grid, GridItem, Tr, Table, Th, Thead, Tbody, Td } from '@chakra-ui/react';
import fs from 'flatstore';
import { Link } from 'react-router-dom';

import { GiLaurelsTrophy, } from '@react-icons';

function GameInfoTop10(props) {

    if (!props.leaderboard) {
        return <Box>
            <Text as="h4">No rankings found.</Text>
        </Box>
    }

    let user = fs.get('user');
    let player_stats = fs.get('player_stats');
    let game = fs.get('game');

    let playerGameStats = player_stats[game.game_slug];

    const renderRankings = (players) => {



        let leaderboard = props.leaderboard || [];
        let elems = [];

        let tag = props.tag || 'default'

        for (var player of leaderboard) {
            let isLocalPlayer = user?.displayname == player.value;
            let isPast5Rank = player.rank == 10 && (playerGameStats && playerGameStats.ranking > 10);
            elems.push(
                <Tr key={tag + '-leaderboard-' + player.value} lineHeight="4rem" height="4rem" >
                    <Td isNumeric borderBottom={isPast5Rank ? '2px solid' : undefined}
                        borderBottomColor={isPast5Rank ? 'gray.300' : undefined}>
                        <HStack width="auto" justifyContent={'flex-end'} spacing="1rem">
                            {player.rank == 1 && (<Icon as={GiLaurelsTrophy} color='gold' />)}
                            {player.rank == 2 && (<Icon as={GiLaurelsTrophy} color='silver' />)}
                            {player.rank == 3 && (<Icon as={GiLaurelsTrophy} color='#A78553' />)}
                            <Text
                                fontSize="xs"
                                fontWeight={isLocalPlayer ? 'bold' : 'normal'}
                                color={isLocalPlayer ? "yellow.100" : 'white'}>


                                {player.rank}
                            </Text>
                        </HStack>
                    </Td>
                    <Td borderBottom={isPast5Rank ? '2px solid' : undefined}
                        borderBottomColor={isPast5Rank ? 'gray.300' : undefined}>
                        <Link to={'/profile/' + player.value}>
                            <Text
                                fontSize="xs"
                                fontWeight={isLocalPlayer ? 'bold' : 'normal'}
                                color={isLocalPlayer ? "yellow.100" : 'white'}>
                                {player.value}
                            </Text>
                        </Link>
                    </Td>
                    <Td
                        borderBottom={isPast5Rank ? '2px solid' : undefined}
                        borderBottomColor={isPast5Rank ? 'gray.300' : undefined}>
                        <Text
                            fontSize="xs"
                            fontWeight={isLocalPlayer ? 'bold' : 'normal'}
                            color={isLocalPlayer ? "yellow.100" : 'white'}>
                            {player.score}
                        </Text>
                    </Td>
                </Tr>
            )
        }
        return elems;
    }

    let playerRank = -1;
    for (var player of props.leaderboard) {
        let isLocalPlayer = user?.displayname == player.value;
        if (isLocalPlayer) {
            playerRank = player.rank;
            break;
        }
    }

    let lbCount = props.leaderboardCount || 0;
    if (lbCount == 0) {
        return (
            <Box>
                <Text mt='1rem' fontWeight={'bold'}>No rankings yet.</Text>
            </Box>
        )
    }
    return (
        <Box w="100%" pt="1rem" pb="2rem">

            <VStack w="100%">

                <Table variant='simple' mb={playerRank == -1 ? '1rem' : '0'} width="100%">
                    <Thead>
                        <Tr>
                            <Th color={'gray.100'} width="10rem" fontSize="sm" lineHeight="3rem" height="3rem" isNumeric>Rank</Th>
                            <Th color={'gray.100'} width="20rem" fontSize="sm" lineHeight="3rem" height="3rem" >Player</Th>
                            <Th color={'gray.100'} width="10rem" fontSize="sm" lineHeight="3rem" height="3rem">Rating</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {renderRankings()}
                    </Tbody>
                </Table>
                <Box w="100%" display={playerRank == -1 ? 'none' : 'block'} lineHeight="3rem" height="3rem" pt="1rem" fontSize="xs" color="gray.300" fontWeight='300'>
                    <Text align='center' display={lbCount > 0 ? 'block' : 'none'}>Rank <Text as="span" fontWeight='bold' color="gray.300">{playerRank || -1}</Text> of {lbCount}
                        {/* in
                        <Text as="span" > Rankings</Text> */}
                    </Text>
                </Box>

            </VStack>
        </Box>

    )
}

export default fs.connect(['leaderboard', 'leaderboardCount'])(GameInfoTop10);