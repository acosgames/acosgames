import {
    Box,
    Flex,
    Stack,
    Image,
    HStack,
    Icon,
    Button,
    Text,
} from '@chakra-ui/react';
import fs from 'flatstore';
import { Link, withRouter } from 'react-router-dom';
// import config from '../config'
import { CgChevronDoubleRightR, CgChevronDoubleDownR, CgChevronDoubleUpR, CgChevronDoubleLeftR } from '@react-icons';
import { ActionPanel } from './ActionPanel';
// import GameActions from './games/GameDisplay/GameActions';



function ACOSHeader(props) {

    let [isMobile] = fs.useWatch('isMobile');
    let [actionToggle] = fs.useWatch('actionToggle');
    let [gameStatus] = fs.useWatch('gameStatus');


    return (
        <Box
            zIndex="20"
            display={'flex'}
            transition={'filter 0.3s ease-in'}
            width="100%"
            maxWidth="1200px"
            h={['3rem', '4rem', '5rem']}
            justifyContent={'center'}
        >
            <Flex alignItems={'center'} justifyContent={'space-between'} h={['3rem', '4rem', '5rem']} width="100%" maxW={['1200px']}>
                <HStack spacing={['2rem', '2rem', "4rem"]} justifyContent={'center'}>
                    <Box
                    ><Link to="/" className="">
                            <Image
                                alt={'A cup of skill logo'}
                                src={`https://cdn.acos.games/file/acospub/acos-logo-standalone4.png`}
                                h={['1.8rem', '1.8rem', "3rem"]} maxHeight={'90%'}
                            />
                            <Text fontSize="1rem">SIMULATOR</Text>
                        </Link>
                    </Box>
                </HStack>
                <Box w="100%" lineHeight="100%" pl="2rem" display={gameStatus == 'none' ? 'none' : 'block'}>
                    <Text fontSize="2rem" fontWeight={'100'}>{gameStatus}</Text>
                    {/* <GameActions />  */}
                </Box>
                <Flex alignItems={'center'} height="100%">
                    <Stack direction={'row'} spacing={0} height="100%">

                        <Box>
                            <ActionPanel />
                        </Box>
                        <Box p="0" m="0" height="100%" lineHeight={'100%'}>
                            <Button onClick={() => { fs.set('actionToggle', !actionToggle) }} height="100%">
                                <Icon as={isMobile ? (actionToggle ? CgChevronDoubleDownR : CgChevronDoubleUpR) : (actionToggle ? CgChevronDoubleRightR : CgChevronDoubleLeftR)} filter={'drop-shadow(0px -12px 24px rgba(0,0,0,0.2))'} fontSize="2rem" color={'white'} />
                            </Button>
                        </Box>
                    </Stack>
                </Flex>
            </Flex >
        </Box >
    );
}

export default fs.connect(['actionToggle', 'isMobile'])(withRouter(ACOSHeader));