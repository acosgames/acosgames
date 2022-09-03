import { Box, IconButton, VStack, Icon, Text, HStack, Grid, GridItem, Tr, Table, Th, Thead, Tbody, Td } from '@chakra-ui/react';
import fs from 'flatstore';
import { Link } from 'react-router-dom';

import { GiLaurelsTrophy, } from '@react-icons';
function GameInfoTop10Highscores(props) {

    if (!props.leaderboardHighscore) {
        return <Box>
            <Text as="h4">No highscores yet.</Text>
        </Box>
    }

    let user = fs.get('user');
    let player_stats = fs.get('player_stats');
    let game = fs.get('game');

    let playerGameStats = player_stats[game.game_slug];

    const renderHighscores = (players) => {

        let leaderboard = props.leaderboardHighscore || [];
        let elems = [];

        let tag = props.tag || 'default'

        for (var player of leaderboard) {
            let isLocalPlayer = user?.displayname == player.value;
            let isPast5Rank = player.rank == 10 && (playerGameStats && playerGameStats.ranking > 10);
            elems.push(
                <Tr key={tag + '-leaderboard-hs-' + player.value}>
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
                            color={isLocalPlayer ? "yellow.100" : 'white'} width="auto" display="inline-block" >
                            {player.score}
                        </Text>
                    </Td>
                </Tr>
            )
        }
        return elems;
    }

    let playerRank = -1;
    for (var player of props.leaderboardHighscore) {
        let isLocalPlayer = user?.displayname == player.value;
        if (isLocalPlayer) {
            playerRank = player.rank;
            break;
        }
    }

    let lbCount = props.leaderboardHighscoreCount || 0;
    if (lbCount == 0) {
        return (
            <Box>
                <Text mt='1rem' fontWeight={'bold'}>No highscores yet.</Text>
            </Box>
        )
    }
    return (
        <Box w="100%" pt="1rem" pb="2rem">

            <VStack w="100%">
                <Table variant='simple' mb={playerRank == -1 ? '1rem' : '0'} width="100%">
                    <Thead>
                        <Tr>
                            <Th color={'gray.100'} fontSize="sm" width="10rem" lineHeight="3rem" height="3rem" isNumeric>Rank</Th>
                            <Th color={'gray.100'} fontSize="sm" width="20rem" lineHeight="3rem" height="3rem" >Player</Th>
                            <Th color={'gray.100'} fontSize="sm" width="10rem" lineHeight="3rem" height="3rem">Highscore</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {renderHighscores()}
                    </Tbody>
                </Table>


                <Box w="100%" display={playerRank == -1 ? 'none' : 'block'} lineHeight="3rem" height="3rem" pt="1rem" fontSize="xs" color="gray.300" fontWeight={'300'}>
                    <Text align='center' display={lbCount > 0 ? 'block' : 'none'}>Rank <Text as="span" fontWeight='bold' color="gray.300">{playerRank || -1}</Text> of {lbCount}
                        {/* in
                        <Text as="span" > Highscore</Text> */}
                    </Text>
                </Box>


            </VStack>
        </Box>

    )
}

export default fs.connect(['leaderboardHighscore', 'leaderboardHighscoreCount'])(GameInfoTop10Highscores);