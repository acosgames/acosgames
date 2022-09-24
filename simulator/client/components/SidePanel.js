
import { Box, HStack, VStack, Text, IconButton, Image, Flex, Button, Icon, Input, Select, Tabs, TabList, TabPanels, TabPanel, Tab } from '@chakra-ui/react';
import fs from 'flatstore';
import { useEffect, useRef, useState } from 'react';

import { IoSend, IoAddSharp, BsChevronBarLeft, BsChevronBarUp, BsChevronBarDown, BsChatDotsFill, AiFillCloseCircle, ImEnter } from '@react-icons';

import { Link, useLocation } from 'react-router-dom';
import { connect, saveGameSettings, updateGameSettings } from '../actions/websocket';
import { joinFakePlayer, joinGame, leaveFakePlayer, leaveGame, newGame, removeFakePlayer, spawnFakePlayers, startGame } from '../actions/game';
import { ChooseGameSettings, ChooseScreenSettings, ChooseTeamSettings } from './GameSettings';

fs.set('chat', []);
fs.set('chatMessage', '');
fs.set('chatMode', 'all');
fs.set('actionToggle', true);
fs.set('gamePanelLayout', 'compact');

function SidePanel(props) {

    let [actionToggle] = fs.useWatch('actionToggle');
    let [isMobile] = fs.useWatch('isMobile');
    let [displayMode] = fs.useWatch('displayMode');

    let toggle = actionToggle && displayMode != 'theatre';
    let desktopIcon = toggle ? <Icon as={AiFillCloseCircle} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.400'} /> : <Icon as={BsChatDotsFill} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.100'} />;
    let mobileIcon = toggle ? <Icon as={AiFillCloseCircle} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.400'} /> : <Icon as={BsChatDotsFill} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.100'} />

    return (
        <HStack
            spacing='0' m="0" p='0'
            bgColor={'blacks.200'}
            flexGrow='1 !important'
            height={!isMobile ? "100%" : (toggle ? '20rem' : '0')}
            transition="width 0.3s ease, height 0.3s ease"
            zIndex={30}
            width={isMobile ? "100%" : (toggle ? ['34.0rem', '34rem', '38.0rem'] : '0')}
            filter='drop-shadow(0 0 5px rgba(25,25,25,.25))'>

            <VStack
                transition="width 0.3s ease, height 0.3s ease"
                width={isMobile ? '100%' : ['24.0rem', '24rem', '28.0rem']}
                height={!isMobile ? "100%" : (toggle ? '20rem' : '0')}
                alignItems="stretch"
                pb={'1rem'}
                position="relative"
                flexGrow='1 !important'
                display='flex !important'
                flexDirection='column !important'
                mt="0"
            >
                <Tabs h="100%" px="0">
                    <TabList>
                        <Tab>Players</Tab>
                        <Tab>State</Tab>
                        <Tab>Settings</Tab>
                    </TabList>

                    <TabPanels h="100%" pb="5rem" >
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0">
                            <Box pt="1rem">
                                <ChoosePlayerName />
                                <DisplayFakePlayers />
                            </Box>
                        </TabPanel>
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0">
                            {/* <Box pl={'1rem'} flex="1" alignSelf="stretch" width="100%" overflow="hidden" overflowY="scroll" >
                                <VStack width="100%" height="100%" spacing={['0.2rem', '0.3rem', "0.5rem"]} justifyContent={'flex-start'} >
                                    <GameActions />
                                </VStack></Box> */}
                        </TabPanel>
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0">

                            <VStack justifyContent={'flex-start'} spacing='2rem' pt="1rem" pb={"4rem"} px="0">

                                <ChooseScreenSettings />

                                <ChooseGameSettings />

                                <ChooseTeamSettings />
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </HStack>
    )
}



function DisplayFakePlayers(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');

    let [wsStatus] = fs.useWatch('wsStatus');
    if (wsStatus == 'disconnected') {
        return <></>
    }

    const renderFakePlayers = () => {

        let elems = [];
        for (const shortid in fakePlayers) {
            let fakePlayer = fakePlayers[shortid];

            elems.push(
                <HStack key={'fakeplayer-' + shortid}>
                    <Text fontSize="1.5rem" width="70%">{fakePlayer.name}</Text>
                    <IconButton
                        fontSize={'2rem'}
                        colorScheme={'clear'}
                        icon={<ImEnter color="gray.300" />}
                        onClick={() => {
                            joinFakePlayer(fakePlayer);
                        }}
                    >
                        Join Game
                    </IconButton>
                    <IconButton
                        fontSize={'2rem'}
                        colorScheme={'clear'}
                        icon={<AiFillCloseCircle color="gray.300" />}
                        onClick={() => {
                            removeFakePlayer(fakePlayer);
                        }}
                    >
                        Leave Game
                    </IconButton>
                </HStack>
            )
        }

        return elems;
    }

    return (
        <VStack>
            {renderFakePlayers()}
            <Box pt="2rem">
                <Button
                    leftIcon={<IoAddSharp color="white" />}
                    fontSize={'xxs'}
                    bgColor={'teal.700'}
                    onClick={() => {
                        spawnFakePlayers();
                    }}>
                    Add Fake Player
                </Button>
            </Box>
        </VStack>
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
        <VStack>
            <Text fontSize="1rem">Choose Player Name</Text>
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




function SaveSettingButton(props) {

    let [gameSettings] = fs.useWatch('gameSettings');
    let [localGameSettings] = fs.useWatch('localGameSettings');
    let needsUpdate = false;
    if (JSON.stringify(gameSettings) != JSON.stringify(localGameSettings))
        needsUpdate = true;

    return <>
    </>
    return (
        <Button
            display={needsUpdate ? 'block' : 'none'}
            fontSize={'xxs'}
            bgColor={'green.800'}
            onClick={saveGameSettings}>
            {'Save'}
        </Button>
    )
}


function ChatHeader(props) {

    let [mode, setMode] = useState('all');

    const onChangeMode = (mode) => {
        setMode(mode);
        fs.set('chatMode', mode);
    }
    return (
        <HStack
            boxShadow={'0 10px 15px -3px rgba(0, 0, 0, .2), 0 4px 6px -2px rgba(0, 0, 0, .1);'}
            pl={'1rem'}
            width={props.isMobile ? '100%' : (props.toggle ? ['24.0rem', '24rem', '34.0rem'] : '0rem')}
            height={['3rem', '4rem', '5rem']}
            spacing={'2rem'}
            mt={'0 !important'} >
            <Text cursor='pointer' as={'span'} fontSize={'xxs'} color={mode == 'all' ? 'gray.100' : 'gray.300'} textShadow={mode == 'all' ? '0px 0px 5px #63ed56' : ''} onClick={() => { onChangeMode('all') }}>Actions</Text>
            <Text cursor='pointer' as={'span'} fontSize={'xxs'} color={mode == 'game' ? 'gray.100' : 'gray.300'} textShadow={mode == 'game' ? '0px 0px 5px #63ed56' : ''} onClick={() => { onChangeMode('game') }}>Players</Text>
            <Text cursor='pointer' as={'span'} fontSize={'xxs'} color={mode == 'party' ? 'gray.100' : 'gray.300'} textShadow={mode == 'party' ? '0px 0px 5px #63ed56' : ''} onClick={() => { onChangeMode('party') }}>Debug</Text>
        </HStack>
    )
}
ChatHeader = fs.connect([])(ChatHeader);



export default SidePanel;




