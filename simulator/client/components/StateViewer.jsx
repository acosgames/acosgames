import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Heading,
    HStack,
    Icon,
    IconButton,
    Select,
    Text,
    Tooltip,
    useClipboard,
    VStack,
} from "@chakra-ui/react";
// import ReactJson from "@vahagn13/react-json-view";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

import { BiSkipPrevious, BiSkipNext, BiExpand } from "react-icons/bi";
import { IoCopy } from "react-icons/io5";
import { useEffect, useState } from "react";
import { replayNext, replayPrev } from "../actions/game";
import GameStateService from "../services/GameStateService";
import { hidden } from "acos-json-encoder";

import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import {
    btDeltaEncoded,
    btDeltaState,
    btGameState,
    btGameStatus,
    btReplayStats,
    btViewerAccordianIndex,
} from "../actions/buckets";
import { useBucket } from "react-bucketjs";

export function StateViewer(props) {
    let [scope, setScope] = useState("server");
    let gameState = useBucket(btGameState);
    let updated = useBucket(btGameState, (state) => state?.room?.updated);
    let viewerAccordianIndex = useBucket(btViewerAccordianIndex);
    let [scopeState, setScopeState] = useState({});
    const { hasCopied, setValue, onCopy } = useClipboard(JSON.stringify(scopeState, null, 2));

    if (!gameState) return <></>;

    let playerList = GameStateService.getPlayersArray();
    let deltaEncoded = btDeltaEncoded.get() || {
        total: 0,
        state: 0,
        players: 0,
        teams: 0,
        room: 0,
        action: 0,
    };
    let simulatedGameState = {};
    let delta = btDeltaState.copy();
    let deltaFullBytes = JSON.stringify(delta);

    let reductionPct = ((1 - deltaEncoded.total / deltaFullBytes.length) * 100).toFixed(0);

    let reductionPctColor = "red.300";
    if (reductionPct > 75) reductionPctColor = "brand.100";
    else if (reductionPct > 50) reductionPctColor = "yellow.300";

    // deltaEncoded = 200;
    let deltaEncodedColor = "brand.50";
    if (deltaEncoded.total >= 500) {
        deltaEncodedColor = "red.300";
    } else if (deltaEncoded.total >= 250) {
        deltaEncodedColor = "brand.900";
    }

    useEffect(() => {
        let copy = {};
        if (scope == "server") {
            copy = GameStateService.getGameState();

            copy.private = {};
            copy.local = {};

            if (Array.isArray(copy.players))
                for (let player of copy.players) delete player.portrait;

            // simulatedGameState = copy;

            setScopeState(copy);
        } else if (scope == "spectator") {
            copy = GameStateService.getGameState();
            let hiddenState = hidden(copy.state);
            let hiddenPlayers = hidden(copy.players);
            copy.private = {};
            copy.local = {};
            // simulatedGameState = copy;
            if (copy?.action?.user?.shortid) copy.action.user = copy.action.user.shortid;

            if (copy?.action && "timeseq" in copy.action) delete copy.action.timeseq;

            if (copy?.action && "timeleft" in copy.action) delete copy.action.timeleft;


            setScopeState(copy);
        } else if (scope == "packet") {
            let temp = GameStateService.getGameState();
            // delta.local = {};
            // for (let shortid in delta.players)
            //     delete delta.players[shortid].portrait;
            // simulatedGameState = delta;
            copy = structuredClone(delta);
            copy.action = temp.action;

            setScopeState(copy);
        } else {
            copy = GameStateService.getGameState();
            let hiddenState = hidden(copy.state);
            let hiddenPlayers = hidden(copy.players);
            let hiddenRoom = hidden(copy.room);
            let scopePlayer = Array.isArray(copy.players)
                ? copy.players[scope]
                : null;

            if (!scopePlayer) {
                setScope("server");
                return <></>
            }

            if (hiddenPlayers && hiddenPlayers[scope] && scopePlayer) {
                copy.local = Object.assign({}, scopePlayer, hiddenPlayers[scope]);
                copy.private = { players: [{ ...hiddenPlayers[scope], shortid: scope }] };
            }

            if (scopePlayer) copy.local = scopePlayer;


            setScopeState(copy);
        }
    }, [scope, updated]);

    let accordianIndex = 0;

    return (
        <VStack width="100%" spacing="0">

            <Card mb="0.5rem">
                <CardBody>
                    <VStack>
                        <HStack py="0rem" width="100%">
                            <Box maxW="15rem">
                                <ReplayControls />
                            </Box>
                            <VStack flex="1" justifyContent={"flex-end"}>
                                <Text fontWeight={"500"} color="gray.10">
                                    JSON Scope
                                </Text>
                                <Select
                                    w="15rem"
                                    bgColor="gray.950"
                                    color="gray.10"
                                    defaultValue={"server"}
                                    onChange={(e) => {
                                        setScope(e.target.value);
                                    }}
                                    fontSize="1.2rem"
                                >
                                    <option fontSize="1rem" value="server">
                                        Server
                                    </option>
                                    <option fontSize="1rem" value="spectator">
                                        Spectator
                                    </option>
                                    <option fontSize="1rem" value="packet">
                                        Delta Packet
                                    </option>
                                    {playerList.map((p, i) => (
                                        <option
                                            key={"scope-" + p.displayname}
                                            fontSize="1rem"
                                            value={i}
                                        >
                                            {p.displayname}
                                        </option>
                                    ))}
                                </Select>
                            </VStack>
                        </HStack>
                    </VStack>
                </CardBody>
            </Card>
            <HStack spacing="0.25rem">
                <Text fontSize="1.2rem" fontWeight="400">
                    Encoded Packet:{" "}
                </Text>
                <Text fontSize="1.4rem" color={deltaEncodedColor} fontWeight="500">
                    {deltaEncoded.total}{" "}
                </Text>
                <Text fontSize="1.2rem" color={deltaEncodedColor} fontWeight="400">
                    bytes
                </Text>
                <Tooltip
                    placement="top"
                    label={
                        <VStack spacing="0" alignItems={"center"}>
                            <Text as="span">Original size </Text>
                            <Text fontWeight={"bold"} fontSize="1.4rem">
                                {deltaFullBytes.length} bytes
                            </Text>
                            <Text fontSize="1.1rem" color={reductionPctColor}>
                                reduced by {reductionPct}%
                            </Text>
                        </VStack>
                    }
                >
                    <Text as="span" fontSize="1.2rem" color={"gray.100"} fontWeight="400">
                        ({reductionPct || 0}%)
                    </Text>
                </Tooltip>
            </HStack>
            <HStack w="100%" justifyContent={"flex-end"} pl="1rem">
                <HStack
                    position="relative"
                    // w="50%"
                    // justifyContent={"flex-end"}
                    height="4rem"
                >
                    {hasCopied && (
                        <Text position="relative" zIndex={100} as="span" fontSize="xxs">
                            Copied!
                        </Text>
                    )}
                    <Tooltip label="Copy to Clipboard" placement="top">
                        <IconButton
                            fontSize={"1.6rem"}
                            color="gray.100"
                            _hover={{ color: "gray.300" }}
                            _active={{ color: "gray.500" }}
                            icon={<IoCopy color="gray.300" />}
                            // colorScheme={'white'}
                            isRound={true}
                            onClick={onCopy}
                        // {(e) => {
                        //     // setValue(JSON.stringify(scopeState, null, 2));
                        //     // setValue(JSON.stringify(scopeState, null, 2));
                        //     // setTimeout(() => {
                        //         onCopy(e);
                        //     // }, 1);
                        // }}
                        />
                    </Tooltip>
                </HStack>
                <Tooltip
                    label={viewerAccordianIndex.length > 0 ? "Collapse All" : "Expand All"}
                    placement="top"
                >
                    <IconButton
                        bgColor="transparent"
                        icon={
                            viewerAccordianIndex.length > 0 ? (
                                <VscCollapseAll size="2rem" color="gray.10" />
                            ) : (
                                <VscExpandAll size="2rem" color="gray.10" />
                            )
                        }
                        onClick={() => {
                            let viewerAccordianIndex = btViewerAccordianIndex.get();
                            if (viewerAccordianIndex.length > 0) {
                                viewerAccordianIndex = [];
                            } else {
                                viewerAccordianIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                            }
                            btViewerAccordianIndex.set(viewerAccordianIndex);
                        }}
                    ></IconButton>
                </Tooltip>
            </HStack>
            <Accordion
                allowMultiple={true}
                // allowToggle={true}
                pt="0"
                index={viewerAccordianIndex}
                // defaultIndex={[1, 2, 3]}
                // defaultIndex={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                w="100%"
            >
                <ObjectViewer
                    index={accordianIndex++}
                    scope={scope}
                    object={scopeState?.state}
                    encodedLen={deltaEncoded?.state || 0}
                    title="state"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    scope={scope}
                    object={scopeState?.players || (scopeState && '#players' in scopeState ? scopeState["#players"] : {}) }
                    encodedLen={deltaEncoded?.players || 0}
                    title={scopeState && '#players' in scopeState ? "#players" : "players"}
                    bgColor="gray.500"
                />
                {gameState?.teams && (
                    <ObjectViewer
                        index={accordianIndex++}
                        scope={scope}
                        object={scopeState?.teams || (scopeState && '#teams' in scopeState ? scopeState["#teams"] : {}) }
                        encodedLen={deltaEncoded?.teams || 0}
                        title={scopeState && '#teams' in scopeState ? "#teams" : "teams"}
                        bgColor="gray.500"
                    />
                )}
                {gameState?.timer && (
                    <ObjectViewer
                        index={accordianIndex++}
                        object={simulatedGameState?.timer}
                        title="timer"
                        bgColor="gray.500"
                    />
                )}
                {/* <ObjectViewer
                    index={accordianIndex++}
                    object={simulatedGameState?.next}
                    title="next"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={simulatedGameState?.events}
                    title="events"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={simulatedGameState?.timer}
                    title="timer"
                    bgColor="gray.500"
                /> */}
                <ObjectViewer
                    index={accordianIndex++}
                    scope={scope}
                    object={scopeState?.room}
                    encodedLen={deltaEncoded.room}
                    title="room"
                    bgColor="gray.500"
                />
                {scope != "packet" && scope != "server" && scope != "spectator" && (
                    <ObjectViewer
                        index={accordianIndex++}
                        scope={scope}
                        object={scopeState?.local}
                        title="local"
                        bgColor="gray.500"
                    />
                )}
                {/* {scope != "packet" && ( */}
                <ObjectViewer
                    index={accordianIndex++}
                    scope={scope}
                    object={scopeState?.action}
                    encodedLen={deltaEncoded?.action || 0}
                    title="action"
                    bgColor="gray.700"
                />
                {/* )} */}
            </Accordion>
            <Text w="100%" fontSize="0.8rem" fontWeight="300" pt="1rem">
                (*) Estimated byte size
            </Text>
        </VStack>
    );
}

function ObjectViewer(props) {
    let object = props.object || {};
    let title = props.title;
    let objectKeysLength = Object.keys(object).length;
    const { hasCopied, onCopy } = useClipboard(JSON.stringify(object, null, 4));

    return (
        <AccordionItem defaultValue={true} bgColor={props.bgColor || "gray.900"} w="100%">
            <AccordionButton
                height="2rem"
                lineHeight={"2rem"}
                px="1rem"
                onClick={(e) => {
                    let viewerAccordianIndex = btViewerAccordianIndex.get();
                    if (!Array.isArray(viewerAccordianIndex)) {
                        viewerAccordianIndex = [];
                    }

                    let index = viewerAccordianIndex.indexOf(props.index);
                    if (index == -1) {
                        viewerAccordianIndex.push(props.index);
                    } else {
                        viewerAccordianIndex.splice(index, 1);
                    }

                    btViewerAccordianIndex.set(viewerAccordianIndex);
                }}
            >
                <HStack flex="1" alignItems={"center"}>
                    <Text fontSize="1.4rem">{title}</Text>
                    {props.scope == "packet" && (
                        <Text ml="1rem" fontSize="1rem" color="gray.20">
                            {props.encodedLen || 0} bytes ({JSON.stringify(object).length} bytes)
                        </Text>
                    )}
                    {/* <Text
                        pl="1rem"
                        display={objectKeysLength > 0 ? "inline-block" : "none"}
                        fontSize="1.2rem"
                        color="gray.100"
                    >
                        {objectKeysLength}
                    </Text> */}
                </HStack>
                <AccordionIcon />
            </AccordionButton>

            <AccordionPanel bgColor={"#2b303a"} position="relative">
                <HStack
                    position="absolute"
                    top="0"
                    right="0.2rem"
                    w="100%"
                    justifyContent={"flex-end"}
                    height="4rem"
                >
                    {hasCopied && (
                        <Text position="relative" zIndex={100} as="span" fontSize="xxs">
                            Copied!
                        </Text>
                    )}
                    <IconButton
                        fontSize={"1.2rem"}
                        color="gray.100"
                        _hover={{ color: "gray.300" }}
                        _active={{ color: "gray.500" }}
                        icon={<IoCopy color="gray.300" />}
                        // colorScheme={'white'}
                        isRound={true}
                        onClick={onCopy}
                    />
                </HStack>
                <VStack w="100%" alignItems={"flex-start"} overflow="hidden">
                    <HStack w="100%"></HStack>
                    <Box px="0" w="100%" minH="2rem">
                        {props.encodedLen != 0 && (
                            <JsonView
                                src={object}
                                theme="vscode"
                                name={false}
                                enableClipboard={false}
                                displayDataTypes={false}
                                displayObjectSize={false}
                            // displayArrayKey={false}
                            />
                        )}
                        {/* <ReactJson
                            src={object}
                            theme="ocean"
                            name={false}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            // displayArrayKey={false}
                        /> */}
                    </Box>
                </VStack>
            </AccordionPanel>
        </AccordionItem>
    );
}

export function ReplayControls(props) {
    let gameStatus = useBucket(btGameStatus);
    let replayStats = useBucket(btReplayStats);
    let hasGameReplay = gameStatus != GameStateService.statusByName("pregame");

    // if (!hasGameReplay)
    //     return <></>

    let position = replayStats.position;
    let total = replayStats.total;
    return (
        <VStack w="100%" h="100%" justifyContent={"center"} spacing="0.5rem">
            <Text
                display={props.hideTitle ? "none" : "inline-block"}
                as="span"
                color="gray.10"
                fontWeight={"500"}
                pb="0.75rem"
            >
                Replay Control
            </Text>
            <HStack justifyContent={"center"} gap="0">
                <Tooltip label={"Previous State"}>
                    <Button
                        fontSize={"xxs"}
                        // bgColor={"gray.850"}
                        p="0"
                        _hover={{
                            color: "gray.100",
                        }}
                        onClick={() => {
                            replayPrev();
                        }}
                    >
                        <Icon w="3rem" h="3rem" as={BiSkipPrevious} />
                    </Button>
                </Tooltip>
                <HStack spacing="0.5rem">
                    <Text
                        as="span"
                        w={total > 999 ? "4rem" : total > 99 ? "3rem" : "2rem"}
                        textAlign={"right"}
                    >
                        {position}
                    </Text>
                    <Text as="span" fontSize="1rem">
                        of
                    </Text>
                    <Text
                        as="span"
                        w={total > 999 ? "4rem" : total > 99 ? "3rem" : "2rem"}
                        textAlign={"left"}
                    >
                        {total}
                    </Text>
                </HStack>
                <Tooltip label={"Next State"}>
                    <Button
                        fontSize={"xxs"}
                        // bgColor={"gray.850"}
                        p="0"
                        _hover={{
                            color: "gray.100",
                        }}
                        onClick={() => {
                            replayNext();
                        }}
                    >
                        <Icon w="3rem" h="3rem" as={BiSkipNext} />
                    </Button>
                </Tooltip>
            </HStack>
        </VStack>
    );
}
