import { Box, Center, Fade, Flex, Heading, IconButton, Image, Portal, ScaleFade, Text, useToast, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { useEffect, useRef, useState } from 'react';
import fs from 'flatstore';
// import { sendLoadMessage } from '../../../actions/connection';
import { BsArrowsFullscreen, CgMinimizeAlt } from '@react-icons';

// import { findGamePanelByRoom, getGame, getRoom, getRoomStatus, setIFrame, updateGamePanel } from '../../../actions/room';

// import LoadingBox from './games/GameDisplay/LoadingBox';

// import GameMessageOverlay from './GameMessageOverlay';

import { withRouter } from 'react-router-dom';
import Connection from './Connection';

fs.set('iframes', {});
fs.set('iframesLoaded', {});


function GamePanel(props) {

    let key = 'gamepanel';
    let [gamepanel] = fs.useWatch(key, fs.get(key));
    let [loaded] = fs.useWatch(key + '>loaded');
    let [wsStatus] = fs.useWatch('wsStatus');

    // const gamepanel = props.gamepanel;
    // if (!gamepanel) {
    //     return <LoadingBox />
    // }

    // const room_slug = gamepanel?.room?.room_slug;
    // if (!room_slug)
    //     return <LoadingBox />

    // let room = getRoom(room_slug);
    // if (!room)
    //     return <LoadingBox />

    if (wsStatus != 'ingame') {
        return <></>
    }
    // let game = getGame(room.game_slug);
    // if (!game)
    // return <LoadingBox />

    // let primaryCanvasRef = fs.get('primaryCanvasRef');

    return (
        <Box w="100%" h="100%">
            <GameIFrame gamepanel={gamepanel} />

        </Box>
    )

}

function GameIFrame(props) {

    let gamepanel = props.gamepanel;
    let [screenConfig] = fs.useWatch('screenConfig');

    let [resize] = fs.useWatch('resize');
    let [isFullScreen] = fs.useWatch('isFullScreen');
    let [displayMode] = fs.useWatch('displayMode');

    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(true);
    const iframeRef = useRef(null)
    const gamescreenRef = useRef(null)
    const gamewrapperRef = useRef(null)
    const gameResizer = useRef();

    // const room_slug = room.room_slug;
    // const game_slug = room.game_slug;
    // const version = room.version;

    let screentype = screenConfig.screentype;
    let resow = screenConfig.resow;
    let resoh = screenConfig.resoh;
    let screenwidth = screenConfig.screenwidth;


    // if (room.mode == 'experimental') {
    //     screentype = game.latest_screentype;
    //     resow = game.latest_resow;
    //     resoh = game.latest_resoh;
    //     screenwidth = game.latest_screenwidth;
    // }
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
        // let windowWidth = isFullscreen ? window.screen.width : gamewrapperRef.current.offsetWidth;
        // let windowHeight = isFullscreen ? window.screen.height : gamewrapperRef.current.offsetHeight;
        let windowWidth = gamewrapperRef.current.offsetWidth;
        let windowHeight = gamewrapperRef.current.offsetHeight;

        // let roomStatus = getRoomStatus(room_slug);
        let offsetRatio = !isLoaded ? 0.1 : 1;

        // if (isLoaded) {
        //     if (roomStatus == 'GAME' || roomStatus == 'LOADING' || roomStatus == 'GAMEOVER') {
        //         offsetRatio = 1;
        //     }
        //     if (roomStatus == 'NOSHOW' || roomStatus == 'ERROR') {
        //         offsetRatio = 0.4;
        //     }
        // }


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

        if (screentype == '3') {
            gamescreenRef.current.style.width = bgWidth + 'px';
            gamescreenRef.current.style.height = bgHeight + 'px';
            scale = ((bgWidth / screenwidth));

            iframeRef.current.setAttribute('style', transformStr({
                scale: scale,
                translateZ: '0'
            }) + `; transform-origin: left top; width:${screenwidth}px; height:${screenheight}px;`);
        }
        else if (screentype == '2') {
            gamescreenRef.current.style.width = bgWidth + 'px';
            gamescreenRef.current.style.height = bgHeight + 'px';
            iframeRef.current.setAttribute('style', 'width:100%; height:100%;')
        }
        else if (screentype == '1') {
            gamescreenRef.current.style.width = windowWidth + 'px';
            gamescreenRef.current.style.height = windowHeight + 'px';
            iframeRef.current.setAttribute('style', 'width:100%; height:100%;')
        }
    }


    const myObserver = new ResizeObserver(entries => {
        // this will get called whenever div dimension changes
        //  entries.forEach(entry => {
        //    console.log('width', entry.contentRect.width);
        //    console.log('height', entry.contentRect.height);
        //  });
        onResize();
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

        fs.set('fullScreenElem', gameResizer);

        myObserver.observe(gameResizer.current);

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
            bgColor={'black'}
        >

            <VStack
                className="screen-wrapper"
                // justifyContent={'flex-start'}
                // alignContent={'center'}
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
                    {/* <ScaleFade initialScale={1} in={gamepanel.loaded} width="100%" height="100%" position="relative"> */}
                    {/* <LoadingBox isDoneLoading={gamepanel.loaded} /> */}
                    {/* </ScaleFade> */}
                    <iframe
                        className="gamescreen"
                        ref={iframeRef}
                        // onResize={onResize}
                        onLoad={() => {

                            fs.set('iframe', iframeRef);
                            //let gamepanel = findGamePanelByRoom(room_slug);
                            // gamepanel.iframe = iframeRef;
                            // setIFrame(room_slug, iframeRef);

                            // let iframes = fs.get('iframes') || {};
                            // iframes[room_slug] = iframeRef;
                            // fs.set('iframeLoaded', true);
                            // fs.set('iframes', iframes);
                            // fs.set('gamepanel', gamescreenRef);
                            // fs.set('gamewrapper', gamewrapperRef);
                            // sendLoadMessage(room_slug, game_slug, version);
                            onResize();
                            // setTimeout(() => {
                            //     onResize();
                            // }, 1000);
                            // updateGamePanel(gamepanel);
                        }}
                        src={`/iframe.html`}
                        // srcDoc={iframeSrc}
                        sandbox="allow-scripts"
                    />
                    {/* <GameMessageOverlay gamepanel={gamepanel} /> */}

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
            {/* <Box w="100%" height="3rem" bgColor="blue"></Box> */}
        </VStack>

    )
}

// let onCustomWatched = ownProps => {
//     return ['gamepanel/' + ownProps.id];
// };
// let onCustomProps = (key, value, store, ownProps) => {
//     if (key == ('gamepanel/' + ownProps.id))
//         return { gamepanel: value }
//     return {};
// };


export default withRouter(GamePanel);
