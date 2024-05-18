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
import { useState } from "react";
import { replayNext, replayPrev } from "../actions/game";
import GameStateService from "../services/GameStateService";
import DELTA from "acos-json-delta";

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
    let viewerAccordianIndex = useBucket(btViewerAccordianIndex);

    if (!gameState) return <></>;

    let playerList = GameStateService.getPlayersArray();
    let deltaEncoded = btDeltaEncoded.get() || 0;

    // deltaEncoded = 200;
    let deltaEncodedColor = "brand.50";
    if (deltaEncoded >= 500) {
        deltaEncodedColor = "red.500";
    } else if (deltaEncoded >= 250) {
        deltaEncodedColor = "brand.900";
    }

    if (scope == "server") {
        let copy = GameStateService.getGameState();

        copy.private = {};
        copy.local = {};

        for (let shortid in copy.players) delete copy.players[shortid].portrait;

        gameState = copy;
    } else if (scope == "spectator") {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);
        copy.private = {};
        copy.local = {};
        gameState = copy;
        if (gameState?.action?.user?.shortid)
            gameState.action.user = gameState.action.user.shortid;

        if (gameState?.action && "timeseq" in gameState.action)
            delete gameState.action.timeseq;

        if (gameState?.action && "timeleft" in gameState.action)
            delete gameState.action.timeleft;
    } else if (scope == "packet") {
        let delta = btDeltaState.copy();
        delta.local = {};
        for (let shortid in delta.players)
            delete delta.players[shortid].portrait;
        gameState = delta;
    } else {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);

        if (!copy.players || !copy.players[scope]) {
            setScope("server");
            return <></>;
        }

        if (hiddenPlayers && hiddenPlayers[scope] && copy?.players[scope]) {
            copy.players[scope] = Object.assign(
                {},
                copy.players[scope],
                hiddenPlayers[scope]
            );

            copy.private = { players: { [scope]: hiddenPlayers[scope] } };
        }

        if (copy?.players[scope]) copy.local = copy.players[scope];
        gameState = copy;

        gameState.action = {};
        // delete gameState.action;

        // if (gameState?.action?.user?.shortid)
        //     gameState.action.user = gameState.action.user.shortid;

        // if (gameState?.action && 'timeseq' in gameState.action)
        //     delete gameState.action.timeseq;

        // if (gameState?.action && 'timeleft' in gameState.action)
        //     delete gameState.action.timeleft;
    }

    let accordianIndex = 0;

    return (
        <VStack width="100%" spacing="0">
            {/* <ReactJson
                src={gameState}
                theme="isotope"
                enableClipboard="false"
                displayDataTypes="false"
                displayObjectSize="false"
            /> */}
            <Card mb="0.5rem">
                {/* <CardHeader></CardHeader> */}
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
                                    {playerList.map((p) => (
                                        <option
                                            key={"scope-" + p.shortid}
                                            fontSize="1rem"
                                            value={p.shortid}
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
            <HStack>
                <Text fontSize="1.2rem" fontWeight="400">
                    Delta Encoded Size:{" "}
                </Text>
                <Text
                    fontSize="1.6rem"
                    color={deltaEncodedColor}
                    fontWeight="500"
                >
                    {deltaEncoded}{" "}
                </Text>
                <Text
                    fontSize="1.2rem"
                    color={deltaEncodedColor}
                    fontWeight="400"
                >
                    bytes
                </Text>
            </HStack>
            <HStack w="100%" justifyContent={"flex-start"} pl="1rem">
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
                            viewerAccordianIndex = [
                                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                            ];
                        }
                        btViewerAccordianIndex.set(viewerAccordianIndex);
                    }}
                ></IconButton>
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
                    object={gameState?.state}
                    title="state"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.players}
                    title="players"
                    bgColor="gray.500"
                />
                {gameState?.teams && (
                    <ObjectViewer
                        index={accordianIndex++}
                        object={gameState?.teams}
                        title="teams"
                        bgColor="gray.500"
                    />
                )}
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.next}
                    title="next"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.events}
                    title="events"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.timer}
                    title="timer"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.room}
                    title="room"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.local}
                    title="local"
                    bgColor="gray.500"
                />
                <ObjectViewer
                    index={accordianIndex++}
                    object={gameState?.action}
                    title="action"
                    bgColor="gray.700"
                />
            </Accordion>
        </VStack>
    );
}

function ObjectViewer(props) {
    let object = props.object || {};
    let title = props.title;
    let objectKeysLength = Object.keys(object).length;
    const { hasCopied, onCopy } = useClipboard(JSON.stringify(object, null, 4));

    return (
        <AccordionItem
            defaultValue={true}
            bgColor={props.bgColor || "gray.900"}
            w="100%"
        >
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
                    <Text
                        pl="1rem"
                        display={objectKeysLength > 0 ? "inline-block" : "none"}
                        fontSize="1.2rem"
                        color="gray.100"
                    >
                        {objectKeysLength}
                    </Text>
                </HStack>
                <AccordionIcon />
            </AccordionButton>

            <AccordionPanel bgColor={"#2b303a"} position="relative">
                <HStack
                    position="absolute"
                    top="0"
                    right="0"
                    w="100%"
                    justifyContent={"flex-end"}
                    height="4rem"
                >
                    {hasCopied && (
                        <Text
                            position="relative"
                            zIndex={100}
                            as="span"
                            fontSize="xxs"
                        >
                            Copied!
                        </Text>
                    )}
                    <IconButton
                        fontSize={"1.6rem"}
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
                    <Box px="0" w="100%">
                        <JsonView
                            src={object}
                            theme="vscode"
                            name={false}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            // displayArrayKey={false}
                        />
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
    let hasGameReplay = gameStatus != "pregame";

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
