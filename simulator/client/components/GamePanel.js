import { Box, Button, Center, Fade, Flex, Heading, HStack, Icon, IconButton, Image, Portal, ScaleFade, Text, Tooltip, useToast, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { useEffect, useRef, useState } from 'react';
import fs from 'flatstore';
import { BsArrowsFullscreen, ImEnter, AiFillCloseCircle, IoPlaySharp, GoEye, CgMinimizeAlt } from '@react-icons';
import { withRouter } from 'react-router-dom';
import GamePanelService from '../services/GamePanelService';
import { joinFakePlayer, joinGame, leaveFakePlayer, leaveGame } from '../actions/game';
import GameStateService from '../services/GameStateService';
import { DisplayUserActions } from './PlayerList';

fs.set('iframes', {});
fs.set('iframesLoaded', {});


function GamePanel(props) {

    let gamepanels = fs.get('gamepanels') || {};
    let panelCount = Object.keys(gamepanels)?.length;

    return (
        <Box w="100%" h="100%" position="relative"
        >
            <GameIFrame id={props.id} />
        </Box>
    )

}

function GameIFrame(props) {

    let gamepanel = props.gamepanel;
    let [displayMode] = fs.useWatch('displayMode');
    let [gameSettings] = fs.useWatch('gameSettings');

    const [isOpen, setIsOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(true);
    const iframeRef = useRef(null)
    const gamescreenRef = useRef(null)
    const gamewrapperRef = useRef(null)
    const gameResizer = useRef();

    let screentype = Number.parseInt(gameSettings.screentype);
    let resow = gameSettings.resow;
    let resoh = gameSettings.resoh;
    let screenwidth = gameSettings.screenwidth;

    let screenheight = (resoh / resow) * screenwidth;

    var timestamp = 0;
    var THROTTLE = 0;

    const transformStr = (obj) => {
        var obj = obj || {},
            val = '',
            j;
        for (j in obj) {
            val += j + '(' + obj[j] + ') ';
        }

        return `
            -webkit-transform: ${val}; 
            -moz-transform: ${val}; 
            transform: ${val};
            
        `
    }

    const checkFullScreen = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement ||
            document.mozFullScreenElement)
            return true;
        else
            return false;
    }

    const onResize = () => {
        if (!gamescreenRef?.current || !iframeRef?.current)
            return;

        var now = (new Date).getTime();
        if (now - timestamp < THROTTLE) {
            return onResize;
        }
        timestamp = now;

        let isFullscreen = checkFullScreen();
        let windowWidth = gamewrapperRef.current.offsetWidth;
        let windowHeight = gamewrapperRef.current.offsetHeight;

        let offsetRatio = !isLoaded ? 0.1 : 1;

        windowWidth *= offsetRatio;
        windowHeight *= offsetRatio;

        let bgWidth = 0;
        let bgHeight = 0;
        let scale = 1;
        let wsteps = (windowWidth / resow);
        let hsteps = (windowHeight / resoh);
        let steps = 0;

        if (wsteps < hsteps) {
            steps = wsteps
        }
        else {
            steps = hsteps
        }

        bgWidth = (steps * resow);
        bgHeight = (steps * resoh);

        if (screentype == 3) {
            gamescreenRef.current.style.width = bgWidth + 'px';
            gamescreenRef.current.style.height = bgHeight + 'px';
            scale = ((bgWidth / screenwidth));

            iframeRef.current.setAttribute('style', transformStr({
                scale: scale,
                translateZ: '0'
            }) + `; transform-origin: left top; width:${screenwidth}px; height:${screenheight}px;`);
        }
        else if (screentype == 2) {
            gamescreenRef.current.style.width = bgWidth + 'px';
            gamescreenRef.current.style.height = bgHeight + 'px';
            iframeRef.current.setAttribute('style', 'width:100%; height:100%;')
        }
        else if (screentype == 1) {
            gamescreenRef.current.style.width = windowWidth + 'px';
            gamescreenRef.current.style.height = windowHeight + 'px';
            iframeRef.current.setAttribute('style', 'width:100%; height:100%;')
        }
    }


    let observerTimer = 0;

    const myObserver = new ResizeObserver(entries => {
        onResize();
        fs.set('primaryGamePanel', fs.get('primaryGamePanel'));
    });

    const onFullScreenChange = (evt) => {
        if (document.fullscreenElement) {
            fs.set('isFullScreen', true);
        } else {
            fs.set('isFullScreen', false);
        }
    }


    useEffect(() => {
        window.addEventListener('resize', onResize);
        document.addEventListener('fullscreenchange', onFullScreenChange);

        let gamepanels = fs.get('gamepanels');
        let gamepanel = gamepanels[props.id];
        if (gamepanel) {
            gamepanel.iframe = iframeRef;
        }

        fs.set('fullScreenElem', gameResizer);

        const mainPageRef = fs.get('mainPageRef');
        myObserver.observe(mainPageRef.current);

        setTimeout(() => {
            setIsOpen(true);
        }, 10)

        return () => {
            window.removeEventListener('resize', onResize);
            setIsOpen(false);
        }
    }, [])

    useEffect(() => {
        onResize();


    });

    let lastMessage = fs.get('gameState');
    let players = lastMessage?.players || {};

    let isSpectator = !(props.id in players);

    return (

        <VStack
            spacing="0"
            width="100%"
            height="100%"
            position="absolute"
            zIndex={10}
            top={0}
            left={0}
            justifyContent={'center'}
            alignContent={'center'}
            ref={gameResizer}
            transition={'filter 0.3s ease-in, opacity 0.5s ease-in'}
            filter={isOpen ? 'opacity(1)' : 'opacity(0)'}
            className={'gameResizer'}
        >

            <VStack
                className="screen-wrapper"
                w="100%"
                h={'100%'}
                ref={gamewrapperRef}
                transition={'filter 0.3s ease-in, opacity 0.5s ease-in'}
                filter={isOpen ? 'opacity(1)' : 'opacity(0)'}
                justifyContent={'flex-start'}
                alignContent={'center'}
                position='relative'
            >

                <Box
                    ref={gamescreenRef}
                    height="100%"
                    position="relative"
                    boxShadow={'0px 12px 24px rgba(0,0,0,0.2)'}
                    alignSelf="center">
                    <iframe
                        className="gamescreen"
                        ref={iframeRef}
                        onLoad={() => {

                            let gamepanels = fs.get('gamepanels');
                            let gamepanel = gamepanels[props.id];

                            gamepanel.iframe = iframeRef;
                            onResize();
                        }}
                        src={'//localhost:3300/g/test-game-4/client/iframe.html'}
                        sandbox="allow-scripts  allow-same-origin"
                    />
                    <HStack position={'absolute'} top={'-3rem'} left="0" height="3rem" width="100%">
                        <DisplayUserInfo id={props.id} />
                        <DisplayUserActions id={props.id} />
                    </HStack>
                </Box>

            </VStack>

            <Box position="absolute" bottom="1rem" right="1rem" display={(props.isFullScreen || displayMode == 'theatre') ? 'block' : 'none'}>
                <IconButton
                    fontSize={'2rem'}
                    colorScheme={'clear'}
                    icon={<CgMinimizeAlt color="gray.300" />}
                    onClick={() => {
                        if (props.displayMode == 'theatre') {
                            fs.set('displayMode', 'none');
                        }
                        if (props.isFullScreen)
                            document.exitFullscreen();
                        // openFullscreen(props.fullScreenElem)
                    }}
                >
                    Exit Full Screen
                </IconButton>
            </Box>


        </VStack>

    )
}



function DisplayUserInfo(props) {

    let [lastMessage] = fs.useWatch('gameState');

    let isInGame = false;
    let players = lastMessage?.players;
    if (players && props.id in players) {
        isInGame = true;
    }

    let user = GamePanelService.getUserById(props.id);

    let isUserNext = GameStateService.validateNextUser(props.id);

    let color = 'white';
    if (!isInGame || !isUserNext)
        color = 'gray.400'

    return (
        <HStack spacing="1rem" px="3rem" width="100%" height="3rem" >
            <Tooltip label={isInGame ? 'In game' : 'Spectator'} placement="top">
                <Text as='span' h="2.1rem">
                    <Icon color={color} as={isInGame ? IoPlaySharp : GoEye} w="1.4rem" h="1.4rem" />
                </Text>
            </Tooltip>
            <Tooltip label={user.id} placement="top">
                <Text
                    cursor={'pointer'}
                    color={color}
                    display="inline-block"
                    fontSize="xs"
                    fontWeight="bold">
                    {user.name}
                </Text>
            </Tooltip>
        </HStack >
    )
}

export default withRouter(GamePanel);
