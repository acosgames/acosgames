import { Component, useEffect, useRef } from "react";

import {
    withRouter,
} from "react-router-dom";
// import GameList from "./games/GameList";

import fs from 'flatstore';


import { Scrollbars } from 'react-custom-scrollbars-2';
import { Box, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import MainMenuChakra from "./MainMenuChakra";
import SidePanel from "./SidePanel";
import GamePanelList from "./GamePanelList";

import { IoSend } from '@react-icons';
import { connect } from "../actions/websocket";


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
                    bg={'gray.800'}>
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
                                    //overflow: 'hidden scroll',
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
                            //px={['0.5rem', '1rem', '5rem']}
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
                                <ChoosePlayerName />
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


function ChoosePlayerName(props) {

    let [username] = fs.useWatch('username');
    let [isMobile] = fs.useWatch('isMobile');


    const inputChange = (e) => {
        let name = e.target.name;
        let value = e.target.value;

        fs.set('username', value);
    }

    const onSubmit = async (e) => {

        localStorage.setItem('username', username);
        connect(username)
    }

    useEffect(() => {
        let savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            fs.set('username', savedUsername);
        }
    }, [])

    let [wsStatus] = fs.useWatch('wsStatus');
    if (wsStatus == 'connected' || wsStatus == 'ingame') {
        return <></>
    }

    return (
        <VStack w="100%" h="100%" alignContent={'center'} alignItems='center' justifyContent={'center'}>
            <Text fontWeight="bold" fontSize="3rem">Choose Player Name</Text>
            <HStack
                width={isMobile ? "100%" : ['24.0rem', '24rem', '28.0rem']}
                height="3rem" px="2rem">

                <Input
                    name="name"
                    id="name"
                    title=""
                    maxLength="120"
                    height="3rem"
                    autoComplete="off"
                    value={username || ''}
                    onChange={inputChange}
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            onSubmit(e)
                        }
                    }}
                />
                <Box
                    width="3rem"
                    height="3rem"
                >
                    <IconButton
                        onClick={onSubmit}

                        icon={<IoSend size="1.6rem" />}
                        width="2.8rem"
                        height="2.8rem"
                        isRound="true"
                    />
                </Box>

            </HStack>
        </VStack>

    )
}

export default withRouter(MainPage);

