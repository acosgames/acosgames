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
import fs from "flatstore";
import ReactJson from "react-json-view";
import { BiSkipPrevious, BiSkipNext, BiExpand } from "react-icons/bi";
import { IoCopy } from "react-icons/io5";
import { useState } from "react";
import { replayNext, replayPrev } from "../actions/game";
import GameStateService from "../services/GameStateService";
import DELTA from "acos-json-delta";

import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";

fs.set("viewerAccordianIndex", [0, 1, 2]);

export function StateViewer(props) {
    let [gameState] = fs.useWatch("gameState");
    let [scope, setScope] = useState("server");
    let [viewerAccordianIndex] = fs.useWatch("viewerAccordianIndex");

    if (!gameState) return <></>;

    let playerList = GameStateService.getPlayersArray();
    let deltaEncoded = fs.get("deltaEncoded") || 0;

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
        gameState = copy;
    } else if (scope == "spectator") {
        let copy = GameStateService.getGameState();
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);
        copy.private = {};
        copy.local = {};
        gameState = copy;
        if (gameState?.action?.user?.id)
            gameState.action.user = gameState.action.user.id;

        if (gameState?.action && "timeseq" in gameState.action)
            delete gameState.action.timeseq;

        if (gameState?.action && "timeleft" in gameState.action)
            delete gameState.action.timeleft;
    } else if (scope == "packet") {
        let delta = fs.copy("deltaState");
        delta.local = {};
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

        // if (gameState?.action?.user?.id)
        //     gameState.action.user = gameState.action.user.id;

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
                                            key={"scope-" + p.id}
                                            fontSize="1rem"
                                            value={p.id}
                                        >
                                            {p.name}
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
            <HStack w="100%" justifyContent={"flex-end"}>
                <IconButton
                    icon={
                        viewerAccordianIndex.length > 0 ? (
                            <VscCollapseAll size="2rem" color="gray.10" />
                        ) : (
                            <VscExpandAll size="2rem" color="gray.10" />
                        )
                    }
                    onClick={() => {
                        let viewerAccordianIndex = fs.get(
                            "viewerAccordianIndex"
                        );
                        if (viewerAccordianIndex.length > 0) {
                            viewerAccordianIndex = [];
                        } else {
                            viewerAccordianIndex = [
                                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                            ];
                        }
                        fs.set("viewerAccordianIndex", viewerAccordianIndex);
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
                    let viewerAccordianIndex = fs.get("viewerAccordianIndex");
                    if (!Array.isArray(viewerAccordianIndex)) {
                        viewerAccordianIndex = [];
                    }

                    let index = viewerAccordianIndex.indexOf(props.index);
                    if (index == -1) {
                        viewerAccordianIndex.push(props.index);
                    } else {
                        viewerAccordianIndex.splice(index, 1);
                    }

                    fs.set("viewerAccordianIndex", viewerAccordianIndex);
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
                <VStack w="100%" alignItems={"flex-start"}>
                    <HStack w="100%"></HStack>
                    <Box px="1rem">
                        <ReactJson
                            src={object}
                            theme="ocean"
                            name={false}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            // displayArrayKey={false}
                        />
                    </Box>
                </VStack>
            </AccordionPanel>
        </AccordionItem>
    );
}

export function ReplayControls(props) {
    let [gameStatus] = fs.useWatch("gameStatus");
    let [replayStats] = fs.useWatch("replayStats");
    let hasGameReplay = gameStatus != "pregame";

    // if (!hasGameReplay)
    //     return <></>

    return (
        <VStack w="100%" h="100%" justifyContent={"center"} spacing="0">
            <Text
                display={props.hideTitle ? "none" : "inline-block"}
                as="span"
                color="gray.10"
                fontWeight={"500"}
                pb="0.75rem"
            >
                Replay Control
            </Text>
            <HStack justifyContent={"center"}>
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
                <Text as="span">{replayStats.position}</Text>
                <Text as="span">/</Text>
                <Text as="span">{replayStats.total}</Text>
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
