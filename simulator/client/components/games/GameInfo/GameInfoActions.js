import { Flex, Center, Wrap, Button, IconButton, HStack, VStack, Icon, Text, Box, Menu, MenuButton, MenuList, MenuItem, Link, Tooltip, useToast, useShortcut } from '@chakra-ui/react'
import config from '../../../config'
import { FaThumbsUp, FaThumbsDown, FaGithub, IoWarningSharp, IoShareSocial } from '@react-icons';
import { useState } from 'react';

import { rateGame, reportGame } from '../../../actions/notused/game';
// import { WarningIcon } from '@chakra-ui/icons';
import fs from 'flatstore';

function GameInfoActions(game) {

    const toast = useToast();

    const [liked, setLiked] = useState(game.vote == true);
    const [disliked, setDisliked] = useState(game.vote == false);
    const [votes, setVotes] = useState(game.votes);
    const [report, setReport] = useState(game.report);

    const onLike = async () => {

        if (liked) {
            return;
        }
        let result = await rateGame(game.game_slug, true, liked ? true : disliked ? false : null);
        if (result.ecode) {
            toast({
                title: "[" + error.ecode + "] Liking failed, please try again.",
                duration: "3000"
            })
            return;
        }

        setVotes(result.votes);
        setLiked(true);
        setDisliked(false);

    }

    const onDislike = async () => {

        if (disliked) {
            return;
        }
        let result = await rateGame(game.game_slug, false, liked ? true : disliked ? false : null);
        if (result.ecode) {
            toast({
                title: "[" + error.ecode + "] Disliking failed, please try again.",
                duration: "3000"
            })
            return;
        }

        setVotes(result.votes);
        setLiked(false);
        setDisliked(true);

    }

    const onReport = async (type) => {
        let result = await reportGame(game.game_slug, type);
        if (result.ecode) {
            toast({
                title: "[" + result.ecode + "] Disliking failed, please try again.",
                duration: "3000",
                status: "error"
            })
            return;
        }

        toast({
            title: "Report received.  Investigation will follow.  Thank you.",
            duration: "3000",
            status: "success"
        })

        setReport(type);
    }

    const onShareClick = () => {
        if (navigator.share) {

            navigator.share({
                title: 'Play ' + game.name + ' on acos.games!',
                text: game.shortdesc,
                url: config.https.api + '/g/' + game.game_slug
            }).then(() => {
                gtag('event', 'gameshare', { game_slug: game.game_slug });
                console.log('Thanks for sharing!');
            })
                .catch(console.error);
        } else {
            // shareDialog.classList.add('is-open');
        }
    }


    return (

        <Flex wrap={'wrap'} alignItems={['center', 'center', 'left']} justifyContent={['center', 'center', 'left']} >
            <HStack spacing="2rem" wrap={['wrap', 'wrap', 'nowrap']}>
                <Button onClick={onShareClick} height="2.4rem" leftIcon={<IoShareSocial size="1.4rem" />}>
                    <Text color="white" fontSize="xxs">SHARE</Text>
                </Button>

                <HStack h='100%' spacing="0.5rem" >
                    <Tooltip label="Yes">
                        <IconButton width="2.4rem" height="2.4rem" icon={<FaThumbsUp size="1.4rem" />} onClick={onLike} color={liked ? 'brand.100' : 'white'} />
                    </Tooltip>
                    <Text color="white" fontSize={'xs'} fontWeight={'500'} px="0.1rem">{votes}</Text>
                    <Tooltip label="No">
                        <IconButton width="2.4rem" height="2.4rem" icon={<FaThumbsDown size="1.4rem" />} onClick={onDislike} color={disliked ? 'red.300' : 'white'} />
                    </Tooltip>
                </HStack>
                {/* <HStack spacing="0" pr="1rem" alignContent={'center'} alignItems={'center'}>
                    <Text lineHeight={'1.2rem'} color="white" fontWeight={'500'} fontSize={['1.2rem']} >{game.count || 0}</Text>
                    <Text lineHeight={'1.2rem'} color="white" fontSize={['1rem']} pl={'0.4rem'}>PLAYING</Text>

                </HStack> */}
                <Tooltip label="Discuss issues on GitHub">
                    <Link target="_blank" href={`https://github.com/acosgames/${game.game_slug}/issues`}>
                        <HStack spacing="4px" color="white" lineHeight={'2rem'}>
                            <Icon fontSize={['xxs', 'xxs', 'xs']} as={FaGithub} />
                            <Text fontSize={['xxs', 'xxs', 'xs']} >DISCUSS</Text>
                        </HStack>
                    </Link>
                    {/* <Text color="white" fontSize="xs" lineHeight={"1.3rem"}>
                        
                            <Icon color="white" as={FaGithub} fontSize={'1.6rem'} />DISCUSS
                        </Link>
                    </Text> */}

                </Tooltip>
                <Box alignContent={'right'} ml="1rem">

                    <Menu>
                        <MenuButton as={Button} variant="clear" p={0} >

                            <HStack spacing="2px" color={"gray.500"} lineHeight={'2rem'}>
                                <Icon fontSize={['xxs', 'xxs', 'xs']} as={IoWarningSharp} p="0" />
                                <Text as="span" fontSize={['xxs', 'xxs', 'xs']} >{report > 0 ? 'REPORTED' : 'REPORT'}</Text>
                            </HStack>


                            {/* <HStack spacing="0.2rem" alignContent={'center'}>
                                <Icon as={IoWarningSharp} fontSize="1.6rem" />
                                <Text as="span" fontSize="xs" color="gray.500">{report > 0 ? 'REPORTED' : 'REPORT'}</Text>
                            </HStack> */}

                        </MenuButton>
                        <MenuList>
                            <MenuItem
                                color={report == 1 ? 'red.300' : 'white'}
                                onClick={() => {
                                    onReport(1)
                                }}>Does not work</MenuItem>
                            <MenuItem
                                color={report == 2 ? 'red.300' : 'white'}
                                onClick={() => {
                                    onReport(2)
                                }}>Inappropriate</MenuItem>
                            <MenuItem
                                color={report == 3 ? 'red.300' : 'white'}
                                onClick={() => {
                                    onReport(3)
                                }}>Spam</MenuItem>
                        </MenuList>
                    </Menu>
                </Box>
            </HStack>
        </Flex>


    )
}

export default GameInfoActions;