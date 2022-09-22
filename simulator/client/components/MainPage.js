import { Component, useEffect, useRef } from "react";

import {
    withRouter,
} from "react-router-dom";
// import GameList from "./games/GameList";

import fs from 'flatstore';


import { Scrollbars } from 'react-custom-scrollbars-2';
import { Box, HStack, VStack } from "@chakra-ui/react";
import MainMenuChakra from "./MainMenuChakra";
import SidePanel from "./SidePanel";
import GamePanelList from "./GamePanelList";


function MainPage(props) {

    let [isMobile] = fs.useWatch('isMobile');
    let [displayMode] = fs.useWatch('displayMode');

    const mainPageRef = useRef();
    const primaryCanvasRef = useRef();

    useEffect(() => {
        fs.set('primaryCanvasRef', primaryCanvasRef);

        fs.set('mainPageRef', mainPageRef);
    });

    useEffect(() => {
        gtag('event', 'mainpage');
    }, []);


    return (
        <HStack overflow="hidden" className="wrapper" spacing="0" width="100%" height="100%" m="0" p="0" justifyContent={'center'}>

            <VStack className="panel-main" height="100%" width="100%" spacing="0" justifyContent={'center'} >
                <HStack
                    boxShadow={'#0003 0 4px 6px -1px, #0000001f 0 2px 4px -1px'}
                    spacing="0"
                    w="100%"
                    h={['3rem', '4rem', '5rem']}
                    position={displayMode == 'theatre' ? 'absolute' : "relative"}
                    top={displayMode == 'theatre' ? '-100rem' : '0'}
                    zIndex="20"
                    justifyContent={'center'}
                    // overflow="hidden"
                    px={['0.5rem', '1rem', '5rem']}
                    bg={'blacks.300'}>
                    <MainMenuChakra />
                </HStack>

                <Box id="main-content" w="100%" h={["100%"]} position="relative" ref={primaryCanvasRef}>
                    <Scrollbars
                        renderView={(props) => (
                            <div
                                className="main-scrollbars"
                                style={{
                                    position: 'absolute',
                                    inset: '0px',
                                    overflow: 'hidden scroll',
                                    width: '100%'
                                    // marginRight: '-8px',
                                    // marginBottom: '-8px'
                                }}
                            />)}
                        // renderThumbVertical={(style, props) => <Box  {...props} {...style} w="10px" bgColor={'blacks.700'} className="thumb-vertical" />}
                        hideTracksWhenNotNeeded={true}
                        autoHide
                        autoHideTimeout={2000}
                        autoHideDuration={200}
                    >
                        <VStack
                            px={['0.5rem', '1rem', '5rem']}
                            // pt={'2.5rem'} 
                            spacing="0"
                            justifyContent={'center'}
                            w="100%"
                            height="100%"
                            ref={mainPageRef}
                        >
                            <Box
                                position='relative'
                                flexGrow='1 '
                                height='100% '
                                width='100%'
                                // maxWidth="1200px"
                                display='flex'


                                flexDirection='column'

                                transition={'filter 0.3s ease-in'}
                            // maxW={['1200px']}

                            >
                                <GamePanelList />
                            </Box>

                        </VStack>
                    </Scrollbars>
                </Box>
                {isMobile && (
                    <SidePanel />
                )}
            </VStack>
            {!isMobile && (
                <SidePanel />
            )}
        </HStack >
    )

}

export default withRouter(MainPage);

