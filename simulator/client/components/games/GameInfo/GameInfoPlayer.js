import { Flex, Box, Button, HStack, Text, Icon, Menu, MenuButton, MenuList, MenuItem, Link, Tooltip } from '@chakra-ui/react'



import fs from 'flatstore';




function GameInfoPlayer(game) {


    let user = game.user;
    if (!user) {
        return <></>
    }

    let player_stats = fs.get('player_stats');
    let game = fs.get('game');
    let playerGameStats = player_stats[game.game_slug];


    let ratingTxt = game.played < 10 ? 'Unranked' : game.rating;
    if (playerGameStats.ranking == 1)
        ratingTxt = 'SUPREME MASTER';
    return (
        <Flex spacing="0" w="100%">

            <HStack>
                <Text>{ratingTxt}</Text>
            </HStack>

        </Flex>

    )
}

export default fs.connect(['user'])(GameInfoPlayer);