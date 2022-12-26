
import { Box, HStack, VStack, Text, Button, Icon, Tabs, TabList, TabPanels, TabPanel, Tab } from '@chakra-ui/react';
import fs from 'flatstore';
import { useState } from 'react';

import { BsChatDotsFill, AiFillCloseCircle, ImEnter } from '@react-icons';

import { saveGameSettings } from '../actions/websocket';
import { Settings } from './GameSettings';
import { DisplayMyPlayers, DisplayGamePlayers, DisplayGameActions } from './PlayerList';
import { GameActionsExpanded } from './ActionPanel';
import { StateViewer } from './StateViewer';
import Scoreboard from './Scoreboard';

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
            bgColor={'gray.1200'}
            position={'relative'}
            flexGrow='1 !important'
            height={!isMobile ? "100%" : (toggle ? '20rem' : '0')}
            transition="width 0.3s ease, height 0.3s ease"
            zIndex={30}
            width={isMobile ? "100%" : (toggle ? ['44.0rem', '44rem', '48.0rem'] : '0')}
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
                <Tabs h="100%" px="0" variant='base' defaultIndex={0}>
                    <TabList
                        zIndex="20"
                        display={'flex'}
                        bgColor={'gray.900'}
                        transition={'filter 0.3s ease-in'}
                        width="100%"
                        maxWidth="1200px"
                        h={['3rem', '4rem', '5rem']}
                        justifyContent={'center'}
                        borderBottom="0"

                    >
                        <Tab _focus={{ outline: 'none' }}>Players</Tab>
                        <Tab _focus={{ outline: 'none' }}>JSON</Tab>
                        <Tab _focus={{ outline: 'none' }}>Settings</Tab>
                    </TabList>

                    <TabPanels h="100%" p="0">
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0" p="0">
                            <Box pb="5rem" pt="2rem">

                                <GameActionsExpanded />
                                {/* <DisplayGamePlayers /> */}
                                <Scoreboard />
                                <DisplayMyPlayers />
                            </Box>
                        </TabPanel>
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0" p="0">
                            <Box pb="5rem" pt="2rem">
                                <StateViewer />
                            </Box>
                        </TabPanel>
                        <TabPanel h="100%" overflow="hidden" overflowY="scroll" px="0" p="0" padding={0}>

                            <VStack justifyContent={'flex-start'} spacing='2rem' pb={"4rem"} px="0" pt="2rem">

                                <Settings />
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </HStack>
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




