import {
    AnimatePresence,
    motion,
} from "framer-motion";
import {
    Box,
    Card,
    CardBody,
    CardHeader,
    HStack,
    Text,
    VStack,
    chakra,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import RenderPlayer from "./RenderPlayer";
import { btGameState } from "../../actions/buckets";
import { useBucket } from "react-bucketjs";

const ChakraSimpleBar = chakra(SimpleBar);
const MotionVStack = motion(VStack);

export default function Scoreboard() {
    const scrollRef = useRef<any>();

    return (
        <Card mt="1rem" minHeight={"23rem"}>
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
                    flex="1"
                >
                    <VStack
                        width="100%"
                        height={"100%"}
                        transition={"all 0.3s ease"}
                        boxSizing="border-box"
                        spacing="0rem"
                        position="relative"
                        gap="0"
                        flex="1"
                        mb="0"
                        pb="0"
                        zIndex="2"
                    >
                        <ChakraSimpleBar
                            boxSizing="border-box"
                            flex="1"
                            w="100%"
                            p="0"
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

interface RenderPlayersProps {
    room_slug?: string;
}

export function RenderPlayers({ room_slug }: RenderPlayersProps = {}) {
    const [sort, setSorted] = useState(false);

    const gameState = useBucket(btGameState);
    if(!gameState) return <></>;
    const players = gameState.players;
    const teams = gameState.teams;

    if (teams) {
        return (
            <VStack w="100%" spacing="0">
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
                    <RenderTeams players={players} teams={teams} />
                </AnimatePresence>
            </VStack>
        );
    }

    const playerList = ((players || []) as any[]).slice();

    playerList.sort((a: any, b: any) => {
        if (a.score === b.score) {
            if (sort) return b.displayname.localeCompare(a.displayname);
            return a.displayname.localeCompare(b.displayname);
        }
        if (sort) return a.score - b.score;
        return b.score - a.score;
    });

    return (
        <VStack
            w="100%"
            pt="0.5rem"
            onClick={() => {
                setSorted(!sort);
            }}
        >
            <AnimatePresence>
                {playerList.map((player: any) => (
                    <RenderPlayer key={player.displayname} {...player} />
                ))}
            </AnimatePresence>
        </VStack>
    );
}

interface RenderTeamsProps {
    gamepanelid?: string;
    players: any;
    teams: any;
}

function RenderTeams({ gamepanelid, players, teams }: RenderTeamsProps) {
    if (!players) return <></>;

    const teamList = ((teams || []) as any[]).slice();
    if (!teamList.length) return <></>;

    teamList.sort((a: any, b: any) => {
        if (a.score === b.score) {
            return a?.displayname?.localeCompare(b?.displayname || "unknown");
        }
        return b.score - a.score;
    });

    return (
        <>
            {teamList.map((team: any) => (
                <RenderTeam
                    key={"renderteams-" + team.team_slug}
                    team={team}
                    players={players}
                />
            ))}
        </>
    );
}

interface RenderTeamProps {
    gamepanelid?: string;
    players: any;
    team: any;
}

function RenderTeam({ gamepanelid, players, team }: RenderTeamProps) {
    const teamPlayerList: any[] = team.players.map((id: string) => ({
        ...players[id],
        id,
    }));

    teamPlayerList.sort((a: any, b: any) => {
        if (!a || !b) return 0;
        if (a.score === b.score) {
            return a.displayname.localeCompare(b.displayname);
        }
        return b.score - a.score;
    });

    const playerElems: React.ReactNode[] = [];
    for (let i = 0; i < teamPlayerList.length; i++) {
        const player = teamPlayerList[i];
        if (!player) continue;
        playerElems.push(
            <RenderPlayer
                key={"renderteam-player-" + player.id}
                id={player.id}
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
            alignItems={"flex-start"}
            mt="0.5rem"
        >
            <HStack w="100%" pr="1rem" py="0.5rem">
                <Text
                    w="100%"
                    pl="0.5rem"
                    as="span"
                    fontWeight="300"
                    lineHeight={"1.4rem"}
                    color="gray.50"
                    fontSize="1.2rem"
                >
                    {team.name}
                </Text>
                <Box flex="1"></Box>
                <Text
                    pl="0.5rem"
                    as="span"
                    fontWeight="600"
                    lineHeight={"1.4rem"}
                    color="gray.50"
                    fontSize="1.2rem"
                >
                    {team?.score || 0}
                </Text>
            </HStack>
            <Box
                borderLeft="3px solid"
                borderLeftColor={team ? team.color : "gray.1050"}
                w="100%"
            >
                {playerElems}
            </Box>
        </MotionVStack>
    );
}
