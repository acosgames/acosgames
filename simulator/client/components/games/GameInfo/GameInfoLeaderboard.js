import GameInfoTop10 from './GameInfoTop10'
import GameInfoTop10Highscores from './GameInfoTop10Highscores'
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react'
import FSGGroup from '../../widgets/inputs/FSGGroup';


function GameInfoLeaderboard(props) {

    if (props.gameinfo.maxplayers == 1) {
        return (
            <Box pt='3rem' pb='3rem' width="100%">
                <FSGGroup fontSize="0.8rem" title="Global Top Scores" hfontSize="sm">
                    <GameInfoTop10Highscores />
                </FSGGroup>
            </Box>
        )
    }
    if (!props.gameinfo.lbscore)
        return (
            <Box pt='3rem' pb='3rem' width="100%">
                <FSGGroup fontSize="0.8rem" title="Global Rankings" hfontSize="sm">
                    <GameInfoTop10 />
                </FSGGroup>
            </Box>
        )

    return (
        <Box pt="3rem" pb="3rem" width="100%">
            <Tabs w="100%" variant='enclosed' >
                <TabList>
                    <Tab fontSize="xs" color="gray.300" _selected={{ color: 'white', textShadow: '0px 0px 5px #63ed56' }}>Global Rankings</Tab>
                    <Tab fontSize="xs" color="gray.300" _selected={{ color: 'white', textShadow: '0px 0px 5px #63ed56' }}>Global Top Scores</Tab>
                </TabList>
                <TabPanels>

                    <TabPanel p="0" m="0">
                        <FSGGroup fontSize="0.8rem" title="" hfontSize="sm">
                            <GameInfoTop10 />
                        </FSGGroup>
                    </TabPanel>
                    <TabPanel p="0" m="0">
                        <FSGGroup fontSize="0.8rem" title="" hfontSize="sm">
                            <GameInfoTop10Highscores />
                        </FSGGroup>
                    </TabPanel>
                </TabPanels>

            </Tabs>
        </Box>
    )
}


export default GameInfoLeaderboard;