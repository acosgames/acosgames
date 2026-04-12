import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    HStack,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    VStack,
} from "@chakra-ui/react";
import {
    joinFakePlayer,
    joinGame,
    leaveFakePlayer,
    leaveGame,
    removeFakePlayer,
    spawnFakePlayers,
} from "../actions/game";
import { IoAddSharp } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";
import { AiFillCloseCircle } from "react-icons/ai";
import { IoPersonSharp } from "react-icons/io5";
import { GoEye } from "react-icons/go";
import GameStateService from "../services/GameStateService";
import GamePanelService from "../services/GamePanelService";
import { useBucket } from "react-bucketjs";
import {
    btFakePlayers,
    btGamepanelLayout,
    btGamepanels,
    btGameSettings,
    btGameState,
    btGameStatus,
    btPlayerTeams,
    btPrimaryGamePanel,
    btSocketUser,
    btWebsocketStatus,
} from "../actions/buckets";

export function DisplayGamePlayers() {
    const gameState = useBucket(btGameState);

    const gameSettings = btGameSettings.get();
    const playerTeams = btPlayerTeams.get();

    const playerList = GameStateService.getPlayersArray();
    if (playerList.length === 0) return <></>;

    const renderPlayers = () => {
        for (const player of playerList) {
            const teaminfo = gameSettings?.teams
                ? gameSettings.teams.find(
                      (t: any) => t.team_slug === playerTeams[player.shortid]
                  )
                : null;
            player.teamColor = "rgba(0,0,0,0)";
            player.teamName = "";

            if (teaminfo) {
                player.teamColor = teaminfo.color;
                player.teamName = teaminfo.team_slug;
            }
        }

        playerList.sort((a: any, b: any) => {
            if (a.teamName !== b.teamName) {
                return a.teamName.localeCompare(b.teamName);
            }
            if (a?.rank && b?.rank) return b.rank - a.rank;
            if (a?.score && b?.score) return b.score - a.score;
            return a.displayname.localeCompare(b.displayname);
        });

        const elems: React.ReactNode[] = [];
        for (const player of playerList) {
            const isUserNext = GameStateService.validateNextUser(player.shortid);

            elems.push(
                <Tr
                    key={"ingameplayers-" + player.shortid}
                    px="1rem"
                    bgColor={"gray.900"}
                    borderLeft="5px solid"
                    borderLeftColor={player.teamColor}
                >
                    <Td px="0" pl="1rem" py="1rem">
                        <Text
                            display={
                                typeof player?.rank !== "undefined"
                                    ? "inline-block"
                                    : "none"
                            }
                        >
                            {player.rank}
                        </Text>
                    </Td>
                    <Td px="0" py="1rem">
                        <HStack spacing="0">
                            <Tooltip label={"Is Next"} placement="top">
                                <Box>
                                    <Icon
                                        display={isUserNext ? "inline-block" : "none"}
                                        width="0.8rem"
                                        height="0.8rem"
                                        mr="0.5rem"
                                        color="yellow.200"
                                        as={FaChevronRight}
                                    />
                                </Box>
                            </Tooltip>
                            <Tooltip label={player.shortid} placement="top">
                                <Text>{player.displayname}</Text>
                            </Tooltip>
                        </HStack>
                    </Td>
                    <Td px="0" py="1rem">
                        <Text
                            display={
                                typeof player?.score !== "undefined"
                                    ? "inline-block"
                                    : "none"
                            }
                        >
                            {player.score}
                        </Text>
                    </Td>
                    <Td px="0" py="1rem">
                        <DisplayUserActions shortid={player.shortid} from={"playerlist"} />
                    </Td>
                </Tr>
            );
        }
        return elems;
    };

    return (
        <VStack pt="4rem" pb="4rem" spacing="0" px="0">
            <Text fontWeight="bold">In-Game Players</Text>
            <Table variant="simple" width="100%" p="0" m="0">
                <Thead px="0">
                    <Tr>
                        <Th
                            px="0"
                            py="0.5rem"
                            pl="1rem"
                            color={"gray.100"}
                            fontSize="xxs"
                            lineHeight="2rem"
                            height="2rem"
                        >
                            Rank
                        </Th>
                        <Th
                            px="0"
                            py="0.5rem"
                            color={"gray.100"}
                            fontSize="xxs"
                            lineHeight="2rem"
                            height="2rem"
                        >
                            Player
                        </Th>
                        <Th
                            px="0"
                            py="0.5rem"
                            color={"gray.100"}
                            fontSize="xxs"
                            lineHeight="2rem"
                            height="2rem"
                        >
                            Score
                        </Th>
                        <Th
                            px="0"
                            py="0.5rem"
                            color={"gray.100"}
                            fontSize="xxs"
                            lineHeight="2rem"
                            height="2rem"
                        ></Th>
                    </Tr>
                </Thead>
                <Tbody>{renderPlayers()}</Tbody>
            </Table>
        </VStack>
    );
}

interface JoinButtonProps {
    shortid: string;
    isFakePlayer: boolean;
    isJoinAllowed: boolean;
    from: string;
}

export function JoinButton(props: JoinButtonProps) {
    const gameSettings = useBucket(btGameSettings);

    if (!props.isJoinAllowed) {
        return <></>;
    }

    const hasTeams = gameSettings?.teams && gameSettings.teams.length > 0;
    const anyTeamHasVacancy = GameStateService.anyTeamHasVacancy();

    if (!anyTeamHasVacancy) {
        return <></>;
    }

    return (
        <HStack
            height={"2.4rem"}
            lineHeight="2.4rem"
            spacing="0.5rem"
            justifyContent={"center"}
            alignItems="center"
        >
            <Box>
                <Button
                    display={"block"}
                    fontSize={"xxs"}
                    bgColor={"green.800"}
                    _hover={{ bgColor: "brand.500" }}
                    height={"2.2rem"}
                    lineHeight="2.2rem"
                    onClick={() => {
                        if (props.isFakePlayer) {
                            const fakePlayer = GamePanelService.getUserById(props.shortid);
                            joinFakePlayer(fakePlayer);
                            return;
                        }
                        joinGame();
                    }}
                >
                    Join
                </Button>
            </Box>
            {hasTeams && (
                <Menu>
                    <MenuButton
                        as={Button}
                        fontSize={"xxs"}
                        bgColor={"green.800"}
                        _hover={{ bgColor: "brand.500" }}
                        height={"2.2rem"}
                        lineHeight="2.2rem"
                    >
                        Team
                    </MenuButton>
                    <MenuList>
                        {gameSettings.teams.map((t: any) => {
                            const hasVacancy = GameStateService.hasVacancy(t.team_slug);
                            if (!hasVacancy)
                                return (
                                    <div
                                        key={
                                            props.shortid +
                                            "-" +
                                            props.from +
                                            "team-" +
                                            t.team_slug
                                        }
                                    ></div>
                                );
                            return (
                                <MenuItem
                                    borderLeft={"5px solid"}
                                    borderLeftColor={t.color}
                                    key={
                                        props.shortid +
                                        "-" +
                                        props.from +
                                        "team-" +
                                        t.team_slug
                                    }
                                    value={t.team_slug}
                                    onClick={() => {
                                        if (props.isFakePlayer) {
                                            const fakePlayer = GamePanelService.getUserById(
                                                props.shortid
                                            );
                                            joinFakePlayer(fakePlayer, t.team_slug);
                                            return;
                                        }
                                        joinGame(t.team_slug);
                                    }}
                                >
                                    {t.team_name}
                                </MenuItem>
                            );
                        })}
                    </MenuList>
                </Menu>
            )}
        </HStack>
    );
}

interface DisplayUserActionsProps {
    shortid: string;
    from?: string;
}

export function DisplayUserActions(props: DisplayUserActionsProps) {
    const gameState = useBucket(btGameState);
    const gameSettings = useBucket(btGameSettings);

    const user = GamePanelService.getUserById(props.shortid);
    const isFakePlayer = "clientid" in user;

    const player = GameStateService.getPlayer(props.shortid);
    const isInRoom = player != null;
    const hasVacancy = GameStateService.hasVacancy();

    const isGameActive =
        gameState?.room?.status !== GameStateService.statusByName("gameover") &&
        gameState?.room?.status !== GameStateService.statusByName("gamecancelled") &&
        gameState?.room?.status !== GameStateService.statusByName("gameerror");

    const isJoinAllowed = !isInRoom && hasVacancy;
    const isLeaveAllowed = isInRoom;

    if (!isGameActive) return <></>;

    return (
        <HStack spacing="0.25rem">
            <JoinButton
                from={props.from || ""}
                shortid={props.shortid}
                isFakePlayer={isFakePlayer}
                isJoinAllowed={!!isJoinAllowed}
            />
            <Button
                display={isLeaveAllowed ? "block" : "none"}
                fontSize={"xxs"}
                height={"1.8rem"}
                lineHeight="1.8rem"
                bgColor={"gray.500"}
                onClick={() => {
                    if (isFakePlayer) {
                        const fakePlayer = GamePanelService.getUserById(props.shortid);
                        leaveFakePlayer(fakePlayer);
                        return;
                    }
                    leaveGame();
                }}
            >
                Leave
            </Button>
        </HStack>
    );
}

export function DisplayMyPlayers() {
    const fakePlayers = useBucket(btFakePlayers);
    const gameStatus = useBucket(btGameStatus);
    const primaryGP = useBucket(btPrimaryGamePanel);
    const wsStatus = useBucket(btWebsocketStatus);

    if (wsStatus === "disconnected") {
        return <></>;
    }

    const renderMyPlayers = () => {
        const players = GameStateService.getPlayers();
        const elems: React.ReactNode[] = [];

        let gamepanels = btGamepanels.get();
        let primaryGamePanel = btPrimaryGamePanel.get();
        const gameSettings = btGameSettings.get();
        const playerList = GameStateService.getPlayersArray();
        const playerTeams = btPlayerTeams.get();
        const fakePlayers = btFakePlayers.get() || {};

        const myplayers: any[] = [];
        const socketUser = btSocketUser.get();
        myplayers.push(socketUser);

        for (const shortid in fakePlayers) {
            const fakePlayer = fakePlayers[shortid];
            myplayers.push(fakePlayer);
        }

        for (const player of playerList) {
            const teaminfo = gameSettings?.teams
                ? gameSettings.teams.find(
                      (t: any) => t.team_slug === playerTeams[player.shortid]
                  )
                : null;
            player.teamColor = "rgba(0,0,0,0)";
            player.teamName = "";

            if (teaminfo) {
                player.teamColor = teaminfo.color;
                player.teamName = teaminfo.team_slug;
            }
        }

        for (const p of myplayers) {
            if (!p || !p.shortid) continue;

            const isInGame = p.shortid in players;

            gamepanels = btGamepanels.get();
            const gamepanel = gamepanels[p.shortid];
            const isUserNext = GameStateService.validateNextUser(p.shortid);
            primaryGamePanel = btPrimaryGamePanel.get();
            let color = "white";
            if (!isInGame || !isUserNext) color = "#aaa";

            elems.push(
                <Tr
                    bgColor={gamepanel === primaryGamePanel ? "gray.800" : "gray.900"}
                    key={"myplayers-" + p.shortid}
                >
                    <Td
                        cursor="pointer"
                        borderBottomColor="gray.975"
                        onClick={() => {
                            let gps = btGamepanels.get();
                            let gp = gps[p.shortid];
                            if (gp) {
                                primaryGamePanel = btPrimaryGamePanel.get();
                                if (gp === primaryGamePanel && myplayers.length <= 8) {
                                    btPrimaryGamePanel.set(null);
                                    btGamepanelLayout.set("compact");
                                    return;
                                }
                                btPrimaryGamePanel.set(gp);
                            }
                            btGamepanelLayout.set("expanded");
                        }}
                    >
                        <HStack alignItems={"center"} justifyContent="flex-start" py="0.5rem">
                            <Tooltip label={isInGame ? "In game" : "Spectator"} placement="top">
                                <Text as="span" p="0">
                                    <Icon
                                        color={color}
                                        as={isInGame ? IoPersonSharp : GoEye}
                                        w="1.6rem"
                                        h="1.6rem"
                                    />
                                </Text>
                            </Tooltip>
                            <Tooltip label={p.shortid} placement="top">
                                <Text color={color} fontSize="1.4rem">
                                    {p.displayname}
                                </Text>
                            </Tooltip>
                        </HStack>
                    </Td>
                    <Td borderBottomColor="gray.975">
                        <HStack justifyContent={"flex-end"} alignItems="right">
                            <DisplayUserActions shortid={p.shortid} />
                            <Box
                                display={p.clientid ? "none" : "block"}
                                width="2.5rem"
                            ></Box>
                            <IconButton
                                aria-label="Remove Fake Player"
                                display={p.clientid ? "block" : "none"}
                                fontSize={"2rem"}
                                colorScheme={"clear"}
                                icon={<AiFillCloseCircle color="gray.300" />}
                                onClick={() => {
                                    if (p.clientid) removeFakePlayer(p);
                                }}
                            />
                        </HStack>
                    </Td>
                </Tr>
            );
        }

        return elems;
    };

    return (
        <Card mt="1rem">
            <CardHeader>
                <HStack w="100%" justifyContent={"flex-start"} alignItems="center">
                    <Text fontWeight="500" as="span" flex="1">
                        My Players
                    </Text>
                    <Box>
                        <Button
                            leftIcon={<IoAddSharp color="white" />}
                            fontSize={"xxs"}
                            bgColor={"teal.700"}
                            _hover={{ bgColor: "teal.500" }}
                            onClick={() => {
                                spawnFakePlayers();
                            }}
                        >
                            Add Fake Player
                        </Button>
                    </Box>
                </HStack>
            </CardHeader>
            <CardBody pt="0" pb="2rem">
                <VStack>
                    <Table
                        style={{
                            borderCollapse: "separate",
                            borderSpacing: "0rem",
                        }}
                        size="small"
                        variant="simple"
                        width="100%"
                    >
                        <Tbody>{renderMyPlayers()}</Tbody>
                    </Table>
                </VStack>
            </CardBody>
        </Card>
    );
}
