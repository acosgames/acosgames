
import { Box, HStack, VStack, Text, IconButton, Image, Flex, Button, Icon, Input, Select } from '@chakra-ui/react';
import fs from 'flatstore';
import { useEffect, useRef, useState } from 'react';
// import { clearChatMessages, getChatMessages, sendChatMessage } from '../../actions/notused/chat.js';
// import FSGButton from './widgets/inputs/FSGButton.js';
// import FSGSubmit from './widgets/inputs/FSGSubmit';
// import FSGTextInput from './widgets/inputs/FSGTextInput';
import { IoSend, BsChevronBarRight, BsChevronBarLeft, BsChevronBarUp, BsChevronBarDown, BsChatDotsFill, AiFillCloseCircle, ImEnter } from '@react-icons';

// import config from '../../config'
// import ColorHash from 'color-hash'
import { Link, useLocation } from 'react-router-dom';
import { connect, updateGameSettings } from '../actions/websocket';
import { joinFakePlayer, joinGame, leaveFakePlayer, leaveGame, newGame, spawnFakePlayers, startGame } from '../actions/game';
// import GameActions from '../games/GameDisplay/GameActions';
// import QueuePanel from '../games/QueuePanel.js';

fs.set('chat', []);
fs.set('chatMessage', '');
fs.set('chatMode', 'all');
fs.set('actionToggle', true);
fs.set('gamePanelLayout', 'compact');
// const colorHash = new ColorHash({ lightness: 0.7 });

function ActionPanel(props) {

    let [actionToggle] = fs.useWatch('actionToggle');
    let [isMobile] = fs.useWatch('isMobile');
    let [displayMode] = fs.useWatch('displayMode');

    useEffect(() => {

    }, []);

    // let [toggle, setToggle] = useState(true);

    const onPanelToggle = () => {


        fs.set('actionToggle', !actionToggle);

        // setTimeout(() => {
        //     fs.set('resize', (new Date()).getTime());
        // }, 500)
        // if (toggle) {
        //     fs.set('actionToggle', !toggle);
        //     setToggle(false);
        // }
        // else {
        //     setToggle(true);
        // }

    }

    // let width = '24.0rem';

    let toggle = actionToggle && displayMode != 'theatre';
    let desktopIcon = toggle ? <Icon as={AiFillCloseCircle} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.400'} /> : <Icon as={BsChatDotsFill} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.100'} />;
    let mobileIcon = toggle ? <Icon as={AiFillCloseCircle} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.400'} /> : <Icon as={BsChatDotsFill} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'gray.100'} />
    return (
        // position={'fixed'} top="0" right="0" 
        // zIndex={'99'}

        <HStack
            spacing='0' m="0" p='0'
            bgColor={'blacks.200'}
            flexGrow='1 !important'
            height={!isMobile ? "100%" : (toggle ? '20rem' : '0')}
            transition="width 0.3s ease, height 0.3s ease"
            // borderTop={(props.isMobile && toggle) ? '1px solid #333' : ''}
            zIndex={30}
            width={isMobile ? "100%" : (toggle ? ['24.0rem', '24rem', '28.0rem'] : '0')}
            filter='drop-shadow(0 0 5px rgba(25,25,25,.25))'>
            {/* {props.isMobile && (
                <GameActions />
            )} */}
            {/* <Button
                onClick={onPanelToggle}
                // _focus={{ outline: 'none' }}
                // bgColor={'transparent'}
                // _active={{ bgColor: 'transparent' }}
                // _hover={{ bgColor: 'gray.700' }}
                position={'absolute'}
                transition="top 0.3s ease, left 0.3s ease, right 0.3s ease"
                top={!props.isMobile ? 0 : (!toggle ? '-4rem' : '0')}
                //left={!props.isMobile ? (toggle ? 'auto' : '-3rem') : 'auto'}
                right={!props.isMobile ? (toggle ? '0.5rem' : '0.5rem') : '0'}
                // icon={props.isMobile ? mobileIcon : desktopIcon}
                width="3rem"
                zIndex={10}
                height={['3rem', '4rem', '5rem']}
                lineHeight={!props.isMobile ? ['3rem', '4rem', '5rem'] : '0'}
                // isRound="false"
                //zIndex="100"
                colorScheme={'none'}
                // colorScheme="black"
                // bgColor="gray.100"
                borderRadius={'5px 0 0 5px'}

            >
                {props.isMobile ? mobileIcon : desktopIcon}
            </Button> */}

            <VStack
                transition="width 0.3s ease, height 0.3s ease"
                width={isMobile ? '100%' : ['24.0rem', '24rem', '28.0rem']}

                //borderLeft={(!props.isMobile && toggle) ? "1px solid" : ''}
                //borderLeftColor={(!props.isMobile && toggle) ? 'blacks.500' : ''}
                //left={props.isMobile ? '0' : (toggle ? '0' : '2rem')}
                height={!isMobile ? "100%" : (toggle ? '20rem' : '0')}
                alignItems="stretch"
                pb={'1rem'}
                // height="calc(100% - 10rem)"
                position="relative"


                // overflow='hidden scroll !important'
                // _webkitBoxFlex='1 !important'
                flexGrow='1 !important'
                // height='100% !important'
                //   width='100% !important'
                display='flex !important'
                flexDirection='column !important'
                mt="0"
            // zIndex='10 !important'
            >




                <ChatHeader toggle={toggle} isMobile={isMobile} />
                {/* <QueuePanel /> */}
                <ChatMessages toggle={toggle} />



            </VStack>

        </HStack>
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

function ChatMessages(props) {

    // useEffect(() => {
    //     clearChatMessages();
    // }, [])

    const location = useLocation();
    const messageListRef = useRef();
    const scrollRef = useRef();

    return (
        <Box pl={'1rem'} flex="1" alignSelf="stretch" width="100%" overflow="hidden" overflowY="scroll" ref={scrollRef}>
            <VStack width="100%" height="100%" spacing={['0.2rem', '0.3rem', "0.5rem"]} justifyContent={'flex-start'} >
                <ChoosePlayerName />
                <GameActions />
                <div ref={messageListRef} />
            </VStack>
        </Box>

    )
}
ChatMessages = fs.connect(['chat', 'chatMode'])(ChatMessages);
// export ChatMessages;


function GameActions(props) {


    let [socketUser] = fs.useWatch('socketUser');
    let [wsStatus] = fs.useWatch('wsStatus');
    let [gameStatus] = fs.useWatch('gameStatus');
    let [gamePanelLayout] = fs.useWatch('gamePanelLayout');

    // gamePanelLayout = gamePanelLayout || 'compact';

    if (wsStatus == 'disconnected') {
        return <></>
    }

    let isGameRunning = gameStatus != 'gameover' && gameStatus != 'none';
    let isPregame = gameStatus == 'pregame';
    let isInGame = gameStatus != 'pregame';

    return (
        <VStack>
            <HStack>
                <ChooseScreenSettings />
            </HStack>
            <HStack display={isGameRunning ? 'flex' : 'none'}>
                <Button onClick={() => {
                    leaveGame()
                }}>
                    Leave Game
                </Button>
            </HStack>
            {/* <HStack display={gameStatus == 'none' ? 'flex' : 'none'}>
                <Button onClick={() => {
                    joinGame()
                }}>
                    Join Game
                </Button>
            </HStack> */}
            <HStack display={isPregame ? 'flex' : 'none'}>
                <Button onClick={() => {
                    startGame()
                }}>
                    Start Game
                </Button>
            </HStack>
            <HStack display={isInGame ? 'flex' : 'none'}>
                <Button onClick={() => {
                    newGame()
                }}>
                    New Game
                </Button>
            </HStack>
            <HStack display={isGameRunning ? 'flex' : 'none'}>
                <Button onClick={() => {
                    if (gamePanelLayout == 'compact') {
                        fs.set('gamePanelLayout', 'expanded');
                    } else {
                        fs.set('gamePanelLayout', 'compact');
                    }
                }}>
                    Simulator Layout ({gamePanelLayout})
                </Button>
            </HStack>
            <HStack pt="2rem">
                <VStack>
                    <Button onClick={() => {
                        spawnFakePlayers();
                    }}>
                        Spawn Fake Players
                    </Button>
                </VStack>
            </HStack>
            <Box>
                <DisplayFakePlayers />
            </Box>
        </VStack>
    )
}

function DisplayFakePlayers(props) {

    let [fakePlayers] = fs.useWatch('fakePlayers');

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
                            leaveFakePlayer(fakePlayer);
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
        </VStack>
    )

}

function ChooseScreenSettings(props) {

    try {
        let [gameSettings] = fs.useWatch('gameSettings');

        if (!gameSettings)
            return <></>
        return (
            <div>
                <div>

                    <Select
                        fontSize="xs"
                        id="screenType"
                        defaultValue={gameSettings?.screentype || '3'}
                        onChange={(e) => {
                            let val = Number.parseInt(e.target.value);

                            if (!val) {
                                console.error("Invalid screentype value: ", val);
                                return;
                            }

                            gameSettings.screentype = val;
                            updateGameSettings(gameSettings);
                        }}
                    >
                        <option value="1">1. Full Screen</option>
                        <option value="2">2. Fixed Resolution</option>
                        <option value="3">3. Scaled Resolution</option>
                    </Select>
                </div>
                <Box id="viewportResolution" display={gameSettings?.screentype == 1 ? 'none' : 'block'}>
                    <Text as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="resolution">Resolution</Text>
                    <Input
                        type="text"
                        className=""
                        id="resolution"
                        fontSize="xs"
                        aria-describedby=""
                        placeholder="4:3"
                        onChange={(e) => {
                            let parts = e.target.value.split(':');
                            if (parts.length != 2) {
                                console.log("Invalid format for resolution, please use #:# format", e.target.value);
                                return;
                            }

                            try {
                                let resow = Number.parseInt(parts[0]) || 0;
                                let resoh = Number.parseInt(parts[1]) || 0;

                                if (!resow || !resoh) {
                                    console.error("Invalid resolution values: ", resow + ':' + resoh);
                                    return;
                                }

                                gameSettings.resow = resow;
                                gameSettings.resoh = resoh;
                                updateGameSettings(gameSettings);
                            }
                            catch (e) {

                            }

                        }}
                        defaultValue={gameSettings?.resow && (gameSettings?.resow + ':' + gameSettings?.resoh)}
                        w="6rem"
                    />
                </Box>
                <Box id="viewportSize" display={gameSettings?.screentype != 3 ? 'none' : 'block'}>
                    <Text as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="maxwidth">Width (px)</Text>
                    <Input
                        type="text"
                        className=""
                        id="maxwidth"
                        aria-describedby=""
                        defaultValue={gameSettings?.screenwidth || '800'}
                        onChange={(e) => {
                            let val = Number.parseInt(e.target.value);

                            if (!val) {
                                console.error("Invalid max width value: ", val);
                                return;
                            }

                            gameSettings.screenwidth = val;
                            updateGameSettings(gameSettings);
                        }}
                        placeholder={gameSettings?.screenwidth || '800'}
                        w="6rem"
                        fontSize="xs"
                    />
                    <Text color="gray.500" as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="maxheight">Height (px)</Text>
                    <Input
                        type="text"
                        className=""
                        id="maxheight"
                        readOnly
                        aria-describedby=""
                        color="gray.500"
                        fontSize="xs"
                        value={gameSettings?.screenwidth && (gameSettings?.screenwidth * (gameSettings.resoh / gameSettings.resow))}
                        w="6rem"
                    />
                </Box>
            </div>
        )
    }
    catch (err) {
        console.error(err);
        return <></>
    }


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
// ChatSend = fs.connect(['chatMessage'])(ChatSend);

export default ActionPanel;




