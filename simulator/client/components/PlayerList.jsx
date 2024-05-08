import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
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
import fs from "flatstore";
import {
    joinFakePlayer,
    joinGame,
    leaveFakePlayer,
    leaveGame,
    removeFakePlayer,
    spawnFakePlayers,
} from "../actions/game";
import { IoAddSharp, IoPlaySharp } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";
import { AiFillCloseCircle } from "react-icons/ai";
import { MdPerson } from "react-icons/md";
import { GoEye } from "react-icons/go";
import GameStateService from "../services/GameStateService";
import GamePanelService from "../services/GamePanelService";

export function DisplayGamePlayers(props) {
    let [gameState] = fs.useWatch("gameState");

    let gameSettings = fs.get("gameSettings");
    let playerTeams = fs.get("playerTeams");

    let playerList = GameStateService.getPlayersArray();
    if (playerList.length == 0) return <></>;

    const renderPlayers = () => {
        for (const player of playerList) {
            let teaminfo = gameSettings?.teams
                ? gameSettings.teams.find(
                      (t) => t.team_slug == playerTeams[player.id]
                  )
                : null;
            player.teamColor = "rgba(0,0,0,0)";
            player.teamName = "";

            if (teaminfo) {
                player.teamColor = teaminfo.color;
                player.teamName = teaminfo.team_slug;
            }
        }

        playerList.sort((a, b) => {
            if (a.teamName != b.teamName) {
                return a.teamName.localeCompare(b.teamName);
            }

            if (a?.rank && b?.rank) return b.rank - a.rank;
            if (a?.score && b?.score) return b.score - a.score;

            return a.name.localeCompare(b.name);
        });

        let elems = [];
        for (const player of playerList) {
            let isUserNext = GameStateService.validateNextUser(player.id);

            elems.push(
                <Tr
                    key={"ingameplayers-" + player.id}
                    //pb="2rem"
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
                                        display={
                                            isUserNext ? "inline-block" : "none"
                                        }
                                        width="0.8rem"
                                        height="0.8rem"
                                        mr="0.5rem"
                                        color="yellow.200"
                                        as={FaChevronRight}
                                    />
                                </Box>
                            </Tooltip>

                            <Tooltip label={player.id} placement="top">
                                <Text>{player.name}</Text>
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
                        <DisplayUserActions
                            id={player.id}
                            from={"playerlist"}
                        />
                    </Td>
                </Tr>
            );
        }
        return elems;
    };

    return (
        <VStack pt="4rem" pb="4rem" spacing="0" px="0">
            <Text fontWeight="bold">In-Game Players</Text>
            <Table variant="simple" width="100%" p="0" m="0" spacing="0">
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

export function JoinButton(props) {
    let [gameSettings] = fs.useWatch("gameSettings");

    if (!props.isJoinAllowed) {
        return <></>;
    }

    let hasTeams = gameSettings?.teams && gameSettings.teams.length > 0; // GameStateService.hasTeams()
    let anyTeamHasVacancy = GameStateService.anyTeamHasVacancy();

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
                    height={"2.2rem"}
                    lineHeight="2.2rem"
                    onClick={() => {
                        if (props.isFakePlayer) {
                            let fakePlayer = GamePanelService.getUserById(
                                props.id
                            );
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
                        height={"2.2rem"}
                        lineHeight="2.2rem"
                    >
                        Team
                    </MenuButton>
                    <MenuList>
                        {gameSettings.teams.map((t) => {
                            let hasVacancy = GameStateService.hasVacancy(
                                t.team_slug
                            );
                            if (!hasVacancy) return <></>;
                            return (
                                <MenuItem
                                    borderLeft={"5px solid"}
                                    borderLeftColor={t.color}
                                    key={
                                        props.id +
                                        "-" +
                                        props.from +
                                        "team-" +
                                        t.team_slug
                                    }
                                    value={t.team_slug}
                                    onClick={(e) => {
                                        if (props.isFakePlayer) {
                                            let fakePlayer =
                                                GamePanelService.getUserById(
                                                    props.id
                                                );
                                            joinFakePlayer(
                                                fakePlayer,
                                                t.team_slug
                                            );
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

export function DisplayUserActions(props) {
    let [gameState] = fs.useWatch("gameState");
    let [gameSettings] = fs.useWatch("gameSettings");

    let user = GamePanelService.getUserById(props.id);
    let isFakePlayer = "clientid" in user;

    let player = GameStateService.getPlayer(props.id);
    let isInRoom = player != null;
    let hasVacancy = GameStateService.hasVacancy();

    let isGameActive = gameState?.room?.status != "gameover";

    let isJoinAllowed = !isInRoom && hasVacancy;
    let isLeaveAllowed = isInRoom;

    if (!isGameActive) return <></>;

    return (
        <HStack spacing="0.25rem">
            <JoinButton
                from={props.from}
                id={props.id}
                isFakePlayer={isFakePlayer}
                isJoinAllowed={isJoinAllowed}
            />
            <Button
                display={isLeaveAllowed ? "block" : "none"}
                fontSize={"xxs"}
                height={"1.8rem"}
                lineHeight="1.8rem"
                bgColor={"red.800"}
                onClick={(e) => {
                    if (isFakePlayer) {
                        let fakePlayer = GamePanelService.getUserById(props.id);
                        leaveFakePlayer(fakePlayer);
                        return false;
                    }
                    leaveGame();
                    return false;
                }}
            >
                Leave
            </Button>
        </HStack>
    );
}

export function DisplayMyPlayers(props) {
    let [fakePlayers] = fs.useWatch("fakePlayers");
    let [gameStatus] = fs.useWatch("gameStatus");
    let [primaryGP] = fs.useWatch("primaryGamePanel");
    let [wsStatus] = fs.useWatch("wsStatus");
    if (wsStatus == "disconnected") {
        return <></>;
    }

    fakePlayers = fakePlayers || {};
    let fakePlayerIds = Object.keys(fakePlayers);

    const renderMyPlayers = () => {
        let players = GameStateService.getPlayers();
        let elems = [];

        let gamepanels = fs.get("gamepanels");
        let primaryGamePanel = fs.get("primaryGamePanel");
        let gameSettings = fs.get("gameSettings");
        let playerList = GameStateService.getPlayersArray();
        let playerTeams = fs.get("playerTeams");
        let fakePlayers = fs.get("fakePlayers");

        // if (fakePlayerIds.length == 0)
        //     return elems;

        let myplayers = [];
        let socketUser = fs.get("socketUser");
        myplayers.push(socketUser);

        for (const shortid in fakePlayers) {
            let fakePlayer = fakePlayers[shortid];
            myplayers.push(fakePlayer);
        }

        for (const player of playerList) {
            let teaminfo = gameSettings?.teams
                ? gameSettings.teams.find(
                      (t) => t.team_slug == playerTeams[player.id]
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
            // let fakePlayer = fakePlayers[shortid];
            if (!p || !p.id) continue;

            let isInGame = p.id in players;
            // if (isInGame)
            //     continue;

            gamepanels = fs.get("gamepanels");
            let gamepanel = gamepanels[p.id];
            let isUserNext = GameStateService.validateNextUser(p.id);
            primaryGamePanel = fs.get("primaryGamePanel");
            let color = "white";
            if (!isInGame || !isUserNext) color = "#aaa";

            elems.push(
                <Tr
                    bgColor={
                        gamepanel == primaryGamePanel ? "gray.800" : "gray.900"
                    }
                    key={"myplayers-" + p.id}
                >
                    <Td
                        cursor="pointer"
                        borderBottomColor="gray.975"
                        onClick={() => {
                            let gps = fs.get("gamepanels");
                            let gp = gps[p.id];
                            if (gp) {
                                primaryGamePanel = fs.get("primaryGamePanel");

                                //go back to compact if selecting again
                                if (
                                    gp == primaryGamePanel &&
                                    myplayers.length <= 8
                                ) {
                                    fs.set("primaryGamePanel", null);
                                    fs.set("gamePanelLayout", "compact");
                                    return;
                                }

                                fs.set("primaryGamePanel", gp);
                            }
                            fs.set("gamePanelLayout", "expanded");
                        }}
                    >
                        <HStack
                            alignItems={"center"}
                            justifyContent="flex-start"
                            py="0.5rem"
                        >
                            <Tooltip
                                label={isInGame ? "In game" : "Spectator"}
                                placement="top"
                            >
                                <Icon
                                    color={color}
                                    as={isInGame ? MdPerson : GoEye}
                                    w="1.6rem"
                                    h="1.6rem"
                                />
                            </Tooltip>
                            <Tooltip label={p.id} placement="top">
                                <Text color={color} fontSize="1.4rem">
                                    {p.name}
                                </Text>
                            </Tooltip>
                        </HStack>
                    </Td>
                    <Td borderBottomColor="gray.975">
                        <HStack justifyContent={"flex-end"} alignItems="right">
                            <DisplayUserActions id={p.id} />

                            {/* <IconButton
                        fontSize={'2rem'}
                        colorScheme={'clear'}
                        icon={<ImEnter color="gray.300" />}
                        onClick={() => {
                            joinFakePlayer(fakePlayer);
                        }}
                    >
                        Join Game
                    </IconButton> */}
                            <Box
                                display={p.clientid ? "none" : "block"}
                                width="2.5rem"
                            ></Box>
                            <IconButton
                                display={p.clientid ? "block" : "none"}
                                fontSize={"2rem"}
                                colorScheme={"clear"}
                                icon={<AiFillCloseCircle color="gray.300" />}
                                onClick={() => {
                                    if (p.clientid) removeFakePlayer(p);
                                }}
                            >
                                Remove Fake Player
                            </IconButton>
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
                <HStack
                    w="100%"
                    justifyContent={"flex-start"}
                    alignItems="center"
                >
                    <Text fontWeight="500" as="span" flex="1">
                        My Players
                    </Text>
                    <Box>
                        <Button
                            leftIcon={<IoAddSharp color="white" />}
                            fontSize={"xxs"}
                            bgColor={"teal.700"}
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
                        {/* <Thead>
                    <Tr>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem" >Player</Th>
                        <Th color={'gray.100'} fontSize="xxs" lineHeight="3rem" height="3rem">Actions</Th>
                    </Tr>
                </Thead> */}
                        <Tbody>{renderMyPlayers()}</Tbody>
                    </Table>
                </VStack>
            </CardBody>
        </Card>
    );
}
