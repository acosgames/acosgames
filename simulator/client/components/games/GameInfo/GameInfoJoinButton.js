import { Flex, Box, Text, Button, HStack, Icon, Menu, MenuButton, MenuList, MenuItem, Link, Tooltip, VStack, useDisclosure } from '@chakra-ui/react'
import { FaCaretDown, FaPlay, AiTwotoneExperiment, GiSpectacles } from '@react-icons';

import fs from 'flatstore';
import { useHistory } from 'react-router-dom';
import { useEffect } from 'react';

import { getUser, login } from '../../../actions/notused/person';
import { joinGame } from "../../../actions/notused/game";
import { getLastJoinType, setLastJoinType } from '../../../actions/notused/room';
import { validateLogin } from '../../../actions/notused/connection';

fs.set('isCreateDisplayName', false);

function GameInfoJoinButton(props) {

    const history = useHistory();


    const handleJoin = async () => {
        setLastJoinType('rank');

        if (!validateLogin()) {
            return;
        }

        //let game_slug = props.match.params.game_slug;
        let game = fs.get('game');
        if (!game)
            return

        joinGame(game);
    }

    const handleJoinBeta = async () => {

        setLastJoinType('experimental');

        if (!validateLogin()) {
            return;
        }
        //let game_slug = props.match.params.game_slug;
        let game = fs.get('game');
        if (!game)
            return

        joinGame(game, true);
    }

    useEffect(() => {
        // if (!props.justCreatedName)
        //     return;

        // let lastJoin = getLastJoinType();
        // switch (lastJoin) {
        //     case 'rank':
        //         handleJoin();
        //         break;
        //     case 'experimental':
        //         handleJoinBeta();
        //         break;
        //     // default:
        //     //     handleJoin();
        //     //     break;
        // }
    })

    let user = fs.get('user');
    let player_stats = fs.get('player_stats');
    let game = fs.get('game');
    let playerGameStats = player_stats[game.game_slug];




    let isValidUser = user && user.shortid;
    let hasRankLeaderboard = game.maxplayers > 1;

    let version = props.version || 0;
    let latest_version = props.latest_version || 0;
    let hasExtra = version < latest_version;

    let rating = props.played >= 10 ? '' + props.rating + '' : ' ';
    let ratingTxt = props.played >= 10 ? props.ratingTxt : 'UNRANKED';
    ratingTxt = ratingTxt.toUpperCase();

    // if (props.played >= 10 && playerGameStats.ranking == 1)
    //     ratingTxt = 'YOU ARE KING';

    // hasExtra = false;

    return (
        <VStack w="full" spacing="0" pt={hasRankLeaderboard ? '0' : '1rem'}>

            <HStack
                display={(isValidUser && hasRankLeaderboard) ? 'flex' : 'none'}
                transform="perspective(15px) rotateX(1deg)"
                w="90%"
                height="5rem"
                bg="gray.900"
                justifyContent="center"

            // zIndex={-1}
            >
                <VStack>

                    <Text
                        color="yellow.200"
                        fontSize={['xxs', 'xs', 'md',]}
                        fontWeight={'bolder'}
                        lineHeight="1.6rem"
                        align="center">{ratingTxt}</Text>
                    <HStack>
                        <Text
                            display={props.played >= 10 ? 'block' : 'none'}

                            fontSize={['xxs', 'xs', 'md',]}
                            fontWeight="bold"
                            lineHeight={'1.6rem'}
                            pr={'1rem'}
                            align="center">{rating} </Text>
                        <Text
                            display={props.played < 10 ? 'block' : 'none'}
                            fontSize={['xxs', 'xs', 'xs']}
                            pl="0.5rem"
                            lineHeight="1.6rem">{props.played || 0} of 10 games remaining</Text>
                    </HStack>
                </VStack>


            </HStack>

            <Flex spacing="0" w="full">

                <Button
                    flex="1"
                    bgColor="brand.500"
                    _hover={{ bg: "brand.600" }}
                    _active={{ bg: "brand.900" }}
                    size="lg"
                    mr="0"
                    w="70%"
                    h={['3rem', '4rem', "5rem"]}
                    // icon={<FaPlay />}
                    borderTopLeftRadius={"9999px"}
                    borderBottomLeftRadius={"9999px"}

                    borderTopRightRadius={hasExtra ? 0 : '9999px'}
                    borderBottomRightRadius={hasExtra ? 0 : '9999px'}
                    onClick={handleJoin}
                >
                    <Icon ml={hasExtra ? '65px' : 0} as={FaPlay} />
                </Button>
                <Box display={hasExtra ? 'block' : 'none'} >

                    <Menu m="0" >
                        <MenuButton
                            as={Button}
                            size="lg"
                            h={['3rem', '4rem', "5rem"]}
                            borderLeftWidth={'1px'}
                            borderLeftStyle="solid"
                            borderLeftColor="green.300"
                            bgColor={'brand.500'}
                            _hover={{ bg: "brand.600" }}
                            _active={{ bg: "brand.900" }}
                            borderTopLeftRadius={"0"}
                            borderBottomLeftRadius={"0"}
                            borderTopRightRadius={"9999px"}
                            borderBottomRightRadius={"9999px"}
                        >
                            <Icon as={FaCaretDown} mr={1} width="16px" height="16px" />
                        </MenuButton>
                        <MenuList boxShadow={'0 4px 8px rgba(0,0,0,0.4),0 0px 4px rgba(0,0,0,0.4)'} border="0" borderRadius="8px" p="1rem">
                            <MenuItem icon={<GiSpectacles fontSize={'2rem'} />} onClick={() => { }}>Watch Live Matches</MenuItem>
                            <MenuItem icon={<AiTwotoneExperiment fontSize={'2rem'} />} onClick={handleJoinBeta}>Play Experimental Build</MenuItem>

                            {/* <MenuItem>Create Private Room</MenuItem> */}
                        </MenuList>
                    </Menu>

                </Box>

            </Flex>
            <Text pt={'0.5rem'} as="span" fontWeight={'light'} fontSize="xs" display={game.queueCount > 0 ? 'inline-block' : 'none'} color={'yellow.100'}>
                <strong>{game.queueCount}</strong> player(s) waiting
            </Text>
        </VStack >

    )
}

export default fs.connect(['player_stats'])(GameInfoJoinButton);