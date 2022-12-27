import { Box, HStack, Image, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import fs from 'flatstore';
import GameStateService from '../services/GameStateService';
// import { getPrimaryGamePanel, isNextTeam, isUserNext } from '../../actions/room';

// import ratingtext from 'shared/util/ratingtext';
// import config from '../../config'

export default function ScoreboardMulti(props) {


    let [gameState] = fs.useWatch('gameState');
    // let gamepanel = getPrimaryGamePanel();
    // if (!gamepanel)
    //     return <></>

    let players = gameState.players;
    //let [teams] = fs.useWatch('primary/teams');
    if (!players)
        return <></>

    let teams = gameState?.teams || {};
    let teamCount = Object.keys(teams).length;
    let teamElems = [];
    // let isTeamNext = isNextTeam(gamepanel);


    // let players = props.players;

    if (teamCount > 1) {

        for (const teamid in teams) {

            let isTeamNext = GameStateService.validateNextTeam(teams, teamid);
            let team = teams[teamid];
            let playerElems = [];
            let header = (
                <Thead key={'teamplayerheader-' + team.name} >
                    <Tr
                        // bgColor="gray.1000" 

                        spacing="0" width="100%" justifyContent={'center'} alignItems={'center'}
                    // borderRight={'0.5rem solid ' + team.color}

                    >
                        <Th textAlign={'center'} borderBottom="0" px="0.5rem" width="4rem" p="0" pt="0.5rem"
                            borderLeft={'0.5rem solid'}
                            borderLeftColor={isTeamNext ? 'gray.100' : 'transparent'} height="2rem" >
                            <Text color={team.color} align="center" fontSize="sm" fontWeight={'bold'} >{team.score}</Text>
                        </Th>
                        <Th borderBottom="0" p="0" pt="0.5rem" >
                            <Text color={team.color} align="left" fontSize="sm" fontWeight={'bold'} >{team.name}</Text>
                        </Th>
                        <Th borderBottom="0" w="6rem" p="0" pt="0.5rem"
                            borderLeft={'0.5rem solid'}
                            borderLeftColor={isTeamNext ? 'gray.100' : 'transparent'}>
                            <Text color={team.color} align="center" fontSize="2xs">Score</Text>
                        </Th>
                    </Tr>
                </Thead>
            )
            let playersSorted = [];
            for (const id of team.players) {
                playersSorted.push(players[id]);
            }

            playersSorted.sort((a, b) => {
                if (a.rank != b.rank)
                    return b.rank - a.rank;
                if (a.score != b.score)
                    return b.score - a.score;
                return a.name.localeCompare(b.name);
            })

            for (const player of playersSorted) {
                // let player = team.players[id];
                let isNext = GameStateService.validateNextUser(player.id);


                playerElems.push(<ScoreboardPlayersMulti isTeamNext={isTeamNext} isNext={isNext} player={player} key={"player-" + player.name} team={team} />);
            }
            teamElems.push((
                <Table
                    borderLeft={'0.5rem solid'}
                    borderLeftColor={isTeamNext ? 'gray.100' : 'transparent'}
                    size="sm" cellPadding={'0'} cellSpacing='0' w="100%" key={"table-player-elems" + team.name}>
                    {header}
                    <Tbody>
                        {playerElems}
                    </Tbody>
                </Table>
            ))

            teamElems.push(<Box w="100%"
                // bgColor="gray.1000"
                key={'teamspacer-' + team.name} pb="1rem"
                //borderRight={'0.5rem solid ' + team.color}
                borderLeft={'0.5rem solid'}
                borderLeftColor={isTeamNext ? 'gray.100' : 'transparent'}
            ></Box >)
            // teamElems.push(<Box w="100%" bgColor="gray.900" key={'teamspacer2-' + team.name} pb="0.5rem"></Box>)
        }

        // teamElems.pop();
    } else {

        let header = (
            <Thead key={'allplayerheader-'} >
                <Tr
                    // bgColor="gray.1000" 

                    spacing="0" width="100%" justifyContent={'center'} alignItems={'center'}
                // borderRight={'0.5rem solid ' + team.color}
                >
                    <Th textAlign={'center'} borderBottom="0" px="0.5rem" width="4rem" p="0" pt="0.5rem" borderLeft="0.5rem solid transparent" height="2rem" >
                        <Text align="center" color="gray.100" fontSize="xxs" fontWeight={'bold'} >#</Text>
                    </Th>
                    <Th borderBottom="0" p="0" pt="0.5rem" >
                        <Text align="left" color="gray.100" fontSize="xxs" fontWeight={'bold'} >Name</Text>
                    </Th>
                    <Th borderBottom="0" w="6rem" p="0" pt="0.5rem">
                        <Text align="center" color="gray.100" fontSize="xxs" >Score</Text>
                    </Th>
                </Tr>
            </Thead>
        )

        // teamElems.push(
        //     <HStack spacing="0" width="100%" justifyContent={'center'} alignItems={'center'} key={'playerheader'}>
        //         <Text as="span" w='4rem' align="center" fontSize="xxs" color="gray.200">#</Text>
        //         <Text as="span" w='13rem' align="left" fontSize="xxs" color="gray.200">Name</Text>
        //         <Text as="span" w='6rem' align="center" fontSize="xxs" color="gray.200">Score</Text>
        //     </HStack>
        // );

        let playersSorted = [];
        for (const id in players) {
            playersSorted.push(players[id]);
        }

        playersSorted.sort((a, b) => {
            if (a.rank != b.rank)
                return b.rank - a.rank;
            if (a.score != b.score)
                return b.score - a.score;
            return a.name.localeCompare(b.name);
        })

        let playerElems = [];
        for (const player of playersSorted) {
            let isNext = GameStateService.validateNextUser(player.id);
            playerElems.push(<ScoreboardPlayersMulti isNext={isNext} player={player} key={"player-" + player.name} />);
        }

        teamElems.push((
            <Table w="100%" key={"table-player-elems"} style={{ borderCollapse: "separate", borderSpacing: "0 0.25rem" }} pb="1rem">
                {header}
                <Tbody>
                    {playerElems}
                </Tbody>
            </Table>
        ))
    }

    const renderPlayers = () => {

    }

    return teamElems;
}

function ScoreboardPlayersMulti(props) {
    let player = props.player;
    let rank = player.rank + "";
    // if (rank.length < 2) {
    //     rank = "0" + rank;
    // }

    let layoutMode = fs.get('layoutMode');
    let user = fs.get('user');
    // let ratingTxt = ratingtext.ratingToRank(Number.parseInt(player.rating));
    // let ratingImageFile = ratingTxt.replace(/ /ig, '');

    let displayname = player.name;
    if (displayname.length > 16) {
        displayname = displayname.substr(0, 16) + '...';
    }

    return (
        <Tr background="linear-gradient(90deg, rgba(23,23,23,0.3) 0%, rgba(59,59,59,0.3) 46%, rgba(110,110,110,0.3) 100%)">
            <Td
                p="0"

                borderBottom="0"
                borderLeft={'0.5rem solid'}
                borderLeftColor={props.isNext ? 'gray.100' : 'transparent'}
            //bgColor="gray.1000"
            >
                {/* <HStack px="0.5rem" width="4rem" justifyContent={'center'} alignItems={'center'} height="1.6rem" >
                    <Image
                        src={`${config.https.cdn}icons/ranks/${ratingImageFile}.png`}
                        width={'2.4rem'}
                        height={'auto'}
                    />
                </HStack> */}
            </Td>
            <Td
                p="0"
                pt="0.5rem"
                borderBottom="0"
            >
                <Text
                    // w={props.team ? '13rem' : '13rem'}
                    maxWidth={"14rem"}
                    height="2.5rem"
                    lineHeight="2.5rem"
                    align="left"
                    fontSize="xxs"
                    color={player.ingame === false ? 'gray.175' : "white"}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow={'ellipsis'}
                    maxHeight="2.5rem"
                //bgColor="gray.1000"
                >
                    {displayname}
                </Text>
            </Td>
            <Td
                p="0"
                pt="0.5rem"
                borderBottom="0"
            // borderRight={'0.5rem solid ' + props?.team?.color}
            //bgColor="gray.900"
            >
                <Text w='6rem' align="center" fontSize="xxs" lineHeight="1.6rem" color={player.ingame === false ? 'gray.175' : "gray.100"}>{player.score}</Text>
            </Td>
        </Tr>
        // <HStack width="100%" justifyContent={'center'} alignItems={'center'} fontWeight={props.isNext ? 'bold' : ''} key={"player-rank-" + player.name}
        //     borderRight={'0.5rem solid ' + props?.team?.color}
        //     borderLeft={'0.5rem solid'}
        //     borderLeftColor={props.isNext ? 'gray.100' : 'transparent'}
        //     height="1.6rem">
        //     {/* <Text w='3rem' align="center" fontSize="xxs" color="gray.100"></Text> */}



        // </HStack>
    )
}
