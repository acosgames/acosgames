
import { Badge, Box, Button, Text, Flex, IconButton, Input, Portal, Spacer, HStack, Icon, } from '@chakra-ui/react';
import { BsArrowsFullscreen, RiLayoutRightLine, IoTimeOutline } from '@react-icons';

import fs from 'flatstore';
import { useLocation, useParams, withRouter } from 'react-router-dom';

import { joinGame } from '../../../actions/notused/game';
import { wsLeaveGame } from '../../../actions/notused/connection';
import { clearPrimaryGamePanel, clearRoom, getGamePanel, getPrimaryGamePanel, getRoomStatus } from '../../../actions/notused/room';

const resizeEvent = new Event('resize');

function GameActions(props) {


    // const params = useParams();
    // const location = useLocation();

    // console.log('params', params);
    // console.log('location', location);;

    // const game_slug = params.game_slug;
    // const mode = params.mode;
    // const room_slug = params.room_slug;

    let gamepanel = getPrimaryGamePanel();

    if (!gamepanel)
        return <></>

    const room = gamepanel.room;
    const room_slug = room.room_slug;
    const game_slug = room.game_slug;
    const mode = room.mode;


    let gamestate = gamepanel.gamestate;// fs.get('gamestate') || {};//-events-gameover');
    let events = gamestate?.events || {};
    let roomStatus = getRoomStatus(room_slug);
    let isGameover = roomStatus == 'GAMEOVER' || roomStatus == 'NOSHOW' || roomStatus == 'ERROR' || !gamepanel.active;


    /* When the openFullscreen() function is executed, open the video in fullscreen.
    Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */
    const openFullscreen = (elem) => {
        if (!elem)
            return;
        elem = elem.current;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }

        window.dispatchEvent(resizeEvent)
    }

    const onForfeit = (elem) => {

        fs.set('displayMode', 'none');
        if (isGameover) {
            // wsLeaveGame(game_slug, room_slug);
            clearRoom(room_slug);
            clearPrimaryGamePanel();
        }
        else {
            wsLeaveGame(game_slug, room_slug);
        }

    }


    const handleJoin = async () => {

        // let iframe = gamepanel.iframe;// fs.get('iframe');
        //let game_slug = props.match.params.game_slug;
        // let game = fs.get('game');
        // if (!game)
        //     return

        clearRoom(room_slug);
        clearPrimaryGamePanel();
        let isExperimental = mode == 'experimental';// (window.location.href.indexOf('/experimental/') != -1);
        // await wsLeaveGame(game_slug, room_slug);

        //0=experimental, 1=rank
        joinGame({ game_slug: room.game_slug }, isExperimental);



    }



    let latency = fs.get("latency") || 0;
    let latencyColor = 'green';
    if (latency > 400) {
        latencyColor = 'red';
    }
    else if (latency > 200) {
        latencyColor = 'yellow';
    }


    return (
        <HStack h={props.isMobile ? '100%' : '5rem'} w={'100%'} justify={'center'} bgColor={'transparent'} py="0.6rem">
            {/* <HStack alignItems={'center'}>
                <BsBarChartFill size="1.2rem" color={latencyColor} /><Text as="span" fontSize="xxs"> {latency}ms</Text>
            </HStack> */}
            <Box>
                <Button
                    display={!isGameover ? 'block' : 'none'}
                    fontSize={'xxs'}
                    bgColor={'red.800'}
                    onClick={onForfeit}>
                    {'Forfeit'}
                </Button>
            </Box>

            <Box>
                <Button
                    display={isGameover ? 'block' : 'none'}
                    fontSize={'xxs'}
                    bgColor={'red.800'}
                    onClick={onForfeit}>
                    {'Leave'}
                </Button>
            </Box>

            <Box display={isGameover ? 'block' : 'none'} ml="1rem">
                <Button
                    fontSize={'xxs'}
                    bgColor="brand.500"
                    _hover={{ bg: "brand.600" }}
                    _active={{ bg: "brand.900" }}
                    onClick={handleJoin}>
                    Play Again
                </Button>
            </Box>

            <Box>
                <IconButton
                    fontSize={'xxs'}
                    colorScheme={'clear'}
                    icon={<RiLayoutRightLine color="white" />}
                    onClick={() => {
                        fs.set('displayMode', 'theatre');
                        // fs.set('chatToggle', false);
                        // openFullscreen(props.fullScreenElem)
                    }}
                >
                    Full Screen
                </IconButton>
            </Box>

            <Box>
                <IconButton
                    fontSize={'xxs'}
                    colorScheme={'clear'}
                    icon={<BsArrowsFullscreen color="white" />}
                    onClick={() => {
                        openFullscreen(props.fullScreenElem)
                    }}
                >
                    Full Screen
                </IconButton>
            </Box>

            <Timeleft id={gamepanel.id} />


            {/* <LeaveGame></LeaveGame> */}

        </HStack >
    )


}


function Timeleft(props) {
    let gamepanel = getGamePanel(props.id);
    if (!gamepanel)
        return <></>

    let timeleft = fs.get('timeleft/' + props.id) || 0;

    try {
        timeleft = Number.parseInt(timeleft) / 1000;

        if (timeleft > 10)
            timeleft = Math.floor(timeleft);
    }
    catch (e) {
        timeleft = 0;
    }


    return (
        <HStack width="3rem" height={'100%'} alignContent='center'>
            <Icon as={IoTimeOutline} fontSize='xxs' color={'gray.200'}></Icon> <Text color={'gray.100'} fontSize='xxs'>{timeleft}</Text>
        </HStack>
    )
}

Timeleft = fs.connect(['timeleftUpdated'])(Timeleft)


export default (fs.connect(['primaryGamePanel', 'isMobile', 'gamestatusUpdated', 'fullScreenElem'])(GameActions));