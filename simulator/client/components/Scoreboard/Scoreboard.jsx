import {
    Box,
    Card,
    CardBody,
    CardHeader,
    Flex,
    HStack,
    Heading,
    Icon,
    Image,
    Text,
    VStack,
    chakra,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, memo } from "react";

import SimpleBar from "simplebar-react";
// import {
//   findGamePanelByRoom,
//   getPrimaryGamePanel,
// } from "../../../actions/room";

// import ratingconfig from "shared/util/ratingconfig";
// import config from "../../../config";
import fs from "flatstore";
import { motion, AnimatePresence } from "framer-motion";
import RenderPlayer from "./RenderPlayer.jsx";
// import {
//   compareStringified,
//   useBucket,
//   useBucketSelector,
// } from "../../../actions/bucket";
// import { btGamePanels, btPrimaryGamePanel } from "../../../actions/buckets";
const ChakraSimpleBar = chakra(SimpleBar);
const MotionVStack = motion(VStack);

export default function Scoreboard({}) {
    const scrollRef = useRef();

    return (
        <Card mt="1rem">
            <CardHeader pb="0">
                <Text as="span" fontWeight="500">
                    Scoreboard
                </Text>
            </CardHeader>
            <CardBody pt="0">
                <VStack
                    w="100%"
                    h={["100%"]}
                    spacing="0"
                    position="relative"
                    // overflow="hidden"
                    flex="1"
                    // mb="0.5rem"
                    // pt="0.5rem"
                    // px="0.5rem"
                    // mb="1rem"
                >
                    <VStack
                        width="100%"
                        height={"100%"}
                        transition={"all 0.3s ease"}
                        boxSizing="border-box"
                        spacing="0rem"
                        position="relative"
                        // overflow="hidden"
                        gap="0"
                        flex="1"
                        mb="0"
                        pb="0"
                        // borderRadius={"8px"}
                        // border="1px solid"
                        zIndex="2"
                        // borderColor="gray.925"
                        // bgColor="gray.900"
                        // boxShadow="inset 0 0px 6px var(--chakra-colors-gray-1000), inset 0 0px 2px var(--chakra-colors-gray-1000), inset 0 0px 4px var(--chakra-colors-gray-1000)"
                    >
                        <ChakraSimpleBar
                            boxSizing="border-box"
                            flex="1"
                            w="100%"
                            p="0"
                            // borderTop={["2px solid var(--chakra-colors-gray-800)"]}
                            style={{
                                width: "100%",
                                height: "auto",
                                flex: "1",
                                overflow: "visible scroll",
                                boxSizing: "border-box",
                            }}
                            scrollableNodeProps={{ ref: scrollRef }}
                        >
                            <RenderPlayers />
                        </ChakraSimpleBar>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );
}

export function RenderPlayers({ room_slug }) {
    // const [parent, enableAnimations] = useAutoAnimate();
    // let primary = getPrimaryGamePanel();
    // let id = primary?.id;
    // if (room_slug) {
    //     primary = findGamePanelByRoom(room_slug);
    //     id = primary?.id;
    // }

    // let primaryId = useBucketSelector(btGamePanels, (bucket) => bucket[id]);

    let [sort, setSorted] = useState(false);

    // useEffect(() => {
    //   enableAnimations(true);
    // }, []);

    // if (!primary) return <></>;

    // let [gameSettings] = fs.useWatch("gameSettings");
    let [gameState] = fs.useWatch("gameState");
    // let players = gameState.players;

    // let gamestate = gameState;
    let players = gameState.players;
    let teams = gameState.teams;

    if (teams) {
        return (
            <VStack
                w="100%"
                spacing="0"
                // p="0.25rem"
                // spacing="0.25rem"
            >
                <HStack w="100%">
                    <Box h="1px" flex="1"></Box>
                    <Text
                        as="span"
                        color="gray.100"
                        fontWeight="300"
                        fontSize="0.8rem"
                        letterSpacing={"1px"}
                        pr="1rem"
                    >
                        Score
                    </Text>
                </HStack>
                <AnimatePresence>
                    <RenderTeams
                        // gamepanelid={id}
                        players={players}
                        teams={teams}
                    />
                </AnimatePresence>
            </VStack>
        );
    }

    let playerElems = [];
    let playerList = Object.keys(players || {});

    //sort from highest to lowest
    playerList.sort((a, b) => {
        let playerA = players[a];
        let playerB = players[b];
        if (playerA.score == playerB.score) {
            if (sort) return playerB.name.localeCompare(playerA.name);
            return playerA.name.localeCompare(playerB.name);
        }

        if (sort) return playerA.score - playerB.score;

        return playerB.score - playerA.score;
    });

    //render the players
    for (let i = 0; i < playerList.length; i++) {
        let shortid = playerList[i];
        let player = players[shortid];

        playerElems.push(player);
    }

    return (
        <VStack
            w="100%"
            // p="0.25rem"
            // spacing="0.5rem"
            pt="0.5rem"
            onClick={() => {
                setSorted(!sort);
            }}
        >
            <AnimatePresence>
                {/* <LayoutGroup> */}
                {playerElems.map((player) => (
                    <RenderPlayer
                        // gamepanelid={id}
                        key={player.name}
                        {...player}
                    />
                ))}
                {/* </LayoutGroup> */}
            </AnimatePresence>
        </VStack>
    );
}

function RenderTeams({ gamepanelid, players, teams }) {
    // let teamList = Object.keys(teams);
    let teamElems = [];

    if (!players) return <></>;
    // let [teams] = fs.useWatch("teams");
    // let teams = useBucketSelector(
    //     btGamePanels,
    //     (panels) => panels[gamepanelid]?.gamestate?.teams,
    //     compareStringified
    // );

    let teamList = Object.keys(teams || []);
    if (!teamList) return <></>;

    teamList.sort((a, b) => {
        let teamA = teams[a];
        let teamB = teams[b];
        if (teamA.score == teamB.score) {
            return teamA.name.localeCompare(teamB.name);
        }

        return teamB.score - teamA.score;
    });
    // if (teams) teams[teamList[0]].score = 10;

    // teamList.sort((a, b) => {
    //   let teamA = teams[a];
    //   let teamB = teams[b];
    //   if (teamA.score == teamB.score) {
    //     return teamA.name.localeCompare(teamB.name);
    //   }

    //   return teamB.score - teamA.score;
    // });

    for (let i = 0; i < teamList.length; i++) {
        let team_slug = teamList[i];
        let team = teams[team_slug];

        teamElems.push(
            <RenderTeam
                // gamepanelid={gamepanelid}
                key={"renderteams-" + team_slug}
                team={team}
                players={players}
            />
        );
    }

    return teamElems;
}

function RenderTeam({ gamepanelid, players, team }) {
    let playerElems = [];

    team.players.sort((a, b) => {
        let playerA = players[a];
        let playerB = players[b];
        if (playerA.score == playerB.score) {
            if (sort) return playerB.name.localeCompare(playerA.name);
            return playerA.name.localeCompare(playerB.name);
        }

        if (sort) return playerA.score - playerB.score;

        return playerB.score - playerA.score;
    });

    for (let i = 0; i < team.players.length; i++) {
        let shortid = team.players[i];
        let player = players[shortid];
        playerElems.push(
            <RenderPlayer
                // gamepanelid={gamepanelid}
                key={"renderteam-player-" + shortid}
                shortid={shortid}
                {...player}
                team={team}
            />
        );
    }

    return (
        <MotionVStack
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            w="100%"
            spacing="0"
            // mb="1rem"
            alignItems={"flex-start"}
            // bgColor="gray.700"
            mt="0.5rem"

            // _before={
            //     team
            //         ? {
            //               content: "''",
            //               position: "absolute",
            //               width: "calc(100%)",
            //               height: "calc(100% - 1px)",
            //               backgroundColor: team ? team.color : "gray.1050",
            //               zIndex: "10",
            //               // clipPath:
            //               // "polygon(100% calc(100% - 10px), 100% 100%, calc(100% - 10px) 100%)",
            //           }
            //         : {}
            // }
        >
            <HStack w="100%" pr="1rem" py="0.5rem">
                <Text
                    w="100%"
                    // bgColor="gray.1200"
                    pl="0.5rem"
                    as="span"
                    fontWeight="300"
                    lineHeight={"1.4rem"}
                    // pb="0.5rem"
                    color="gray.50"
                    fontSize="1.2rem"
                    // color={team.color}
                    // opacity="0.7"
                    // textShadow={team.color ? '0 0 3px ' + team.color : ''}
                >
                    {team.name}
                </Text>
                <Box flex="1"></Box>
                <Text
                    // bgColor="gray.1200"
                    pl="0.5rem"
                    as="span"
                    fontWeight="600"
                    lineHeight={"1.4rem"}
                    // pb="0.5rem"
                    color="gray.50"
                    fontSize="1.2rem"
                    // color={team.color}
                    // opacity="0.7"
                    // textShadow={team.color ? '0 0 3px ' + team.color : ''}
                >
                    {team?.score || 0}
                </Text>
            </HStack>
            <Box
                borderLeft="3px solid"
                borderLeftColor={team ? team.color : "gray.1050"}
                w="100%"
                // borderRight={team ? "2px solid" : ''}
                // borderRightColor={team ? team.color : ''}>
            >
                {playerElems}
            </Box>
        </MotionVStack>
    );
}
