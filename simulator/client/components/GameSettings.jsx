import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Grid,
    HStack,
    IconButton,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Select,
    Text,
    VStack,
    Wrap,
} from "@chakra-ui/react";
import { updateGameSettings } from "../actions/websocket";
import fs from "flatstore";

import { FaArrowCircleUp, FaArrowCircleDown } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
// import { SketchPicker } from "react-color";
import { AnimatePresence, motion } from "framer-motion";

import { ColorPicker, Hue, Saturation, useColor } from "react-color-palette";
import "react-color-palette/css";

const MotionBox = motion(Box);

export function Settings(props) {
    let [gameSettings] = fs.useWatch("gameSettings");

    let [wsStatus] = fs.useWatch("wsStatus");
    if (wsStatus != "connected" && wsStatus != "ingame") {
        return <></>;
    }

    if (!gameSettings || !("minplayers" in gameSettings)) {
        return <></>;
    }

    return (
        <>
            <ChooseScreenSettings />

            <ChooseGameSettings />

            <ChooseTeamSettings />
        </>
    );
}

export function ChooseGameSettings(props) {
    return (
        <Card>
            <CardHeader>
                <Text fontWeight={"500"}>Game Settings</Text>
            </CardHeader>
            <CardBody pt="0">
                <VStack>
                    <VStack bgColor="gray.900" px="2rem">
                        <HStack spacing="1rem" alignItems={"flex-end"}>
                            <Text w="6rem" color="gray.50" fontWeight={"600"}>
                                Players
                            </Text>
                            <SettingNumberInput
                                id="minplayers"
                                title="Min"
                                placeholder="0"
                            />
                            <SettingNumberInput
                                id="maxplayers"
                                title="Max"
                                placeholder="0"
                            />
                        </HStack>
                        <HStack spacing="1rem" alignItems={"flex-end"}>
                            <Text w="6rem" color="gray.50" fontWeight={"600"}>
                                Teams
                            </Text>
                            <SettingNumberInput
                                id="minteams"
                                title="Min"
                                placeholder="0"
                            />
                            <SettingNumberInput
                                id="maxteams"
                                title="Max"
                                placeholder="0"
                                onChange={(id, value) => {
                                    let teamSettingsRef =
                                        fs.get("teamSettingsRef");
                                    let gameSettings =
                                        fs.get("prevGameSettings");
                                    if (
                                        teamSettingsRef &&
                                        gameSettings.maxteams == 0 &&
                                        value == 1
                                    ) {
                                        setTimeout(() => {
                                            teamSettingsRef.current.parentNode.parentNode.scrollTop =
                                                teamSettingsRef.current.parentNode.scrollHeight; //({ behavior: 'smooth', block: "nearest", inline: "nearest" });
                                        }, 100);
                                    }
                                }}
                            />
                        </HStack>
                    </VStack>
                </VStack>
            </CardBody>
        </Card>
    );
}

export function ChooseTeamSettings(props) {
    const teamSettingsRef = useRef();

    let [gameSettings] = fs.useWatch("gameSettings");

    const renderTeams = () => {
        let teams = gameSettings.teams;
        if (!teams || teams.length == 0) {
            return <></>;
        }

        // let teamList = Object.keys(teams);
        teams.sort((a, b) => {
            return b.team_order - a.team_order;
        });
        let elems = [];
        for (let i = 0; i < teams.length; i++) {
            // let team_slug = teamList[i];
            elems.push(
                <TeamSettings
                    key={"key_" + teams[i].team_slug + "team"}
                    team_order={i}
                />
            );
        }

        return elems;
    };

    useEffect(() => {
        fs.set("teamSettingsRef", teamSettingsRef);
    }, []);

    // if (!gameSettings?.teams || gameSettings.teams.length == 0) {
    //     return <></>
    // }

    return (
        <Card>
            <CardHeader>
                <Text fontWeight={"500"}>Team Settings</Text>
            </CardHeader>
            <CardBody pt="0">
                <VStack
                    ref={teamSettingsRef}
                    display={
                        !gameSettings?.teams || gameSettings.teams.length == 0
                            ? "none"
                            : "flex"
                    }
                >
                    <AnimatePresence>{renderTeams()}</AnimatePresence>
                </VStack>
            </CardBody>
        </Card>
    );
}

function TeamSettings(props) {
    const teamRef = useRef();
    // let [offset, setOffset] = useState(null);
    let [active, setActive] = useState(false);

    const arraymove = (arr, fromIndex, toIndex) => {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    };

    // const getOffset = (el) => {
    //     const rect = el.getBoundingClientRect();
    //     return {
    //         left: rect.left + window.scrollX,
    //         top: rect.top + window.scrollY,
    //     };
    // };

    const onChangeOrder = (dir) => {
        let gameSettings = fs.get("gameSettings");
        let teams = gameSettings.teams;

        // let newIndex = props.team_order + dir;
        // if (newIndex < 0) return;
        // if (newIndex >= teams.length) return;

        // arraymove(teams, props.team_order, newIndex);
        // let teamList = Object.keys(teams);
        teams.sort((a, b) => {
            return a.team_order - b.team_order;
        });

        // let index = teamList.indexOf(props.team_order);
        // let activeTeamSlug = teamList[index];
        // let otherTeamSlug = teamList[index + dir];
        let activeTeam = teams[props.team_order];
        let otherTeam = teams[props.team_order + dir];

        let otherTeamOrder = otherTeam.team_order;
        let activeTeamOrder = activeTeam.team_order;
        otherTeam.team_order = activeTeamOrder;
        activeTeam.team_order = otherTeamOrder;

        teams.sort((a, b) => {
            return a.team_order - b.team_order;
        });
        // for (let i = 0; i < teams.length; i++) {
        //     if (teams[i].team_order != i) {
        //         teams[i].team_order = i;
        //     }
        // }

        updateGameSettings(gameSettings);
        setActive(true);
        setTimeout(() => {
            setActive(false);
        }, 1000);
    };

    // useEffect(() => {
    //     setOffset(getOffset(teamRef.current));
    // }, []);

    // useEffect(() => {
    //     if (active) {
    //         let newOffset = getOffset(teamRef.current);
    //         let yDiff = newOffset.top - offset.top;

    //         // teamRef.current.scrollIntoView();

    //         if (newOffset.top != offset.top) {
    //             setOffset(newOffset);
    //         }
    //     }
    // });

    let gameSettings = fs.get("gameSettings");
    let teams = gameSettings.teams;

    let isUpActive = teams && props.team_order > 0;
    let isDownActive = teams && props.team_order < teams.length - 1;

    return (
        <MotionBox
            layout
            transition={{ duration: 1 }}
            // ref={teamRef}
            pt="2rem"
            pb="2rem"
            // transition={"background 0.3s ease"}
            bgColor={active ? "gray.850" : "gray.850"}
            _hover={{ bgColor: "gray.825" }}
            borderTop={"1px solid"}
            borderTopColor={"gray.600"}
        >
            {/* <Grid templateColumns='80% 20%' bgColor={props.isOdd ? 'gray.900' : ''} w="100%" > */}
            <HStack spacing="2rem">
                <VStack
                    spacing="1rem"
                    justifyContent={"center"}
                    alignContent="center"
                    w="4rem"
                    pl="2rem"
                >
                    <IconButton
                        color={isUpActive ? "gray.50" : "gray.850"}
                        _hover={{ color: isUpActive ? "white" : "gray.850" }}
                        _active={{
                            color: isUpActive ? "gray.50" : "gray.850",
                        }}
                        onClick={() => {
                            if (!isUpActive) return;
                            onChangeOrder(-1);
                        }}
                        cursor={isUpActive ? "pointer" : "default"}
                        icon={<FaArrowCircleUp size="2rem" />}
                        width="2.8rem"
                        height="2.8rem"
                        isRound="true"
                    />
                    <Text
                        as="span"
                        backgroundColor="gray.700"
                        w="3rem"
                        h="3rem"
                        align="center"
                        lineHeight="3.1rem"
                        borderRadius={"50%"}
                        color="gray.10"
                        fontSize="xs"
                        fontWeight={"bold"}
                    >
                        {props.team_order}
                    </Text>
                    <IconButton
                        color={isDownActive ? "gray.50" : "gray.850"}
                        cursor={isDownActive ? "pointer" : "default"}
                        onClick={() => {
                            if (!isDownActive) return;
                            onChangeOrder(1);
                        }}
                        _hover={{ color: isDownActive ? "white" : "gray.850" }}
                        _active={{
                            color: isDownActive ? "gray.50" : "gray.850",
                        }}
                        icon={<FaArrowCircleDown size="2rem" />}
                        width="2.8rem"
                        height="2.8rem"
                        isRound="true"
                    />
                </VStack>

                <VStack spacing="0.5rem" px="3rem">
                    <SettingTextInput
                        id="team_name"
                        title="Name"
                        textWidth="6rem"
                        team_order={props.team_order}
                    />
                    <VStack w="100%" spacing="0">
                        <SettingTextInput
                            id="team_slug"
                            title="Slug"
                            textWidth="6rem"
                            team_order={props.team_order}
                        />

                        <HStack w="100%" pt="1rem">
                            <SettingNumberInput
                                id="minplayers"
                                title="Min Players"
                                team_order={props.team_order}
                            />
                            <SettingNumberInput
                                id="maxplayers"
                                title="Max Players"
                                team_order={props.team_order}
                            />
                        </HStack>
                    </VStack>
                    <Box w="100%" h="3rem">
                        <SettingColorInput
                            id="color"
                            title=""
                            team_order={props.team_order}
                        />
                    </Box>
                </VStack>
            </HStack>
        </MotionBox>
    );
}

const regexColorHex = /^#([0-9a-fA-F]{3}){1,2}$/i;

function SettingColorInput(props) {
    let id = props.id;
    //let [gameSettings] = fs.useWatch('gameSettings');
    let gameSettings = fs.get("gameSettings");

    let currentValue = id in gameSettings ? gameSettings[id] : 0;
    // let [colorValue, setColorValue] = useState(currentValue);

    const [color, setColor] = useColor("#123123");

    let isTeamId = "team_order" in props;
    let team_order = -1;
    if (isTeamId) {
        team_order = Number.parseInt(props.team_order || 0);
        currentValue = gameSettings.teams[team_order][id];
    }

    if (!regexColorHex.test(currentValue)) currentValue = "#f00";

    useEffect(() => {
        if (!regexColorHex.test(currentValue)) {
            let value = "#000000";

            if (props.onChange) props.onChange(id, value);

            let gameSettings = fs.get("gameSettings");
            if (!isTeamId && id in gameSettings) {
                gameSettings[id] = value;
            } else if (isTeamId && gameSettings.teams[team_order]) {
                gameSettings.teams[team_order][id] = value;
            }
            updateGameSettings(gameSettings);
        }
    }, []);

    let timeoutHandle = 0;
    let lastUpdate = Date.now();

    // let value = (props.group && props[props.group]) || colorValue;

    return (
        <VStack h="100%" flex="1">
            <Popover
                flex="1"
                h="100%"
                w="120%"
                outline={"none"}
                _active={{ outline: "none" }}
                bgColor={"transparent"}
            >
                <PopoverTrigger h="100%">
                    <Button
                        flex="1"
                        fontWeight={props.fontWeight || "500"}
                        fontSize={props.fontSize || "2rem"}
                        value={currentValue}
                        textShadow={"2px 2px #000"}
                        color={"gray.0"}
                        bgColor={currentValue || "brand.500"}
                        _hover={{
                            bgColor: currentValue || "brand.500",
                            opacity: 0.8,
                        }}
                        h={props.height || "5rem"}
                        w={props.width || "100%"}
                    >
                        {currentValue || "#f00"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    border="0"
                    width="120%"
                    outline={"none"}
                    _focus={{ outline: "none" }}
                    _active={{ outline: "none" }}
                    bgColor={"transparent"}
                >
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody
                        outline={"none"}
                        _active={{ outline: "none" }}
                        bgColor={"transparent"}
                        width="100%"
                    >
                        {/* <Saturation
                            height={100}
                            color={color}
                            onChange={setColor}
                        /> */}
                        {/* <Hue height={100} color={color} onChange={setColor} /> */}

                        <ColorPicker
                            color={color || "#f00"}
                            onChange={(c1) => {
                                let value = c1.hex;
                                let gameSettings = fs.get("gameSettings");
                                if (!isTeamId && id in gameSettings) {
                                    gameSettings[id] = value;
                                } else if (
                                    isTeamId &&
                                    gameSettings.teams[team_order]
                                ) {
                                    gameSettings.teams[team_order][id] = value;
                                }
                                updateGameSettings(gameSettings);
                                setColor(c1);
                            }}
                            height={100}
                            hideAlpha="true"
                            hideInput={["rgb", "hsv"]}
                        />
                        {/* <SketchPicker
                            defaultValue={currentValue || "#f00"}
                            color={colorValue}
                            onChange={(color) => {
                                let value = color.hex;

                                if (props.onChange) props.onChange(id, value);

                                setColorValue(value);
                            }}
                            onChangeComplete={(color) => {
                                let value = color.hex;

                                let gameSettings = fs.get("gameSettings");
                                if (!isTeamId && id in gameSettings) {
                                    gameSettings[id] = value;
                                } else if (
                                    isTeamId &&
                                    gameSettings.teams[team_order]
                                ) {
                                    gameSettings.teams[team_order][id] = value;
                                }
                                updateGameSettings(gameSettings);
                            }}
                        /> */}
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </VStack>
    );
}

function SettingTextInput(props) {
    let id = props.id;
    let [gameSettings] = fs.useWatch("gameSettings");
    let currentValue = id in gameSettings ? gameSettings[id] : 0;

    let isTeamId = "team_order" in props;
    let team_order = -1;
    if (isTeamId && gameSettings.teams && gameSettings.teams.length > 0) {
        team_order = Number.parseInt(props.team_order || 0);
        currentValue = gameSettings.teams[team_order][id];
    }

    return (
        <HStack
            key={"setting-" + id}
            id={"setting-" + id}
            display={gameSettings?.screentype == 1 ? "none" : "flex"}
            alignItems={"center"}
            width="100%"
            spacing="0"
        >
            <Text
                fontWeight={"bold"}
                as="label"
                w={props.textWidth || "100%"}
                display={props.title ? "inline-block" : "none"}
                pr="0.5rem"
                color="gray.50"
                fontSize="xs"
                htmlFor={id}
            >
                {props.title}
            </Text>
            <Input
                className=""
                id={id}
                fontSize="xs"
                bgColor="gray.950"
                aria-describedby=""
                placeholder={props.placeholder}
                onChange={(e) => {
                    let value = e.target.value;

                    if (props.onChange) props.onChange(id, value);

                    // if( !('team_order' in props) ) {
                    //     fs.set(id, value);
                    // }

                    let gameSettings = fs.get("gameSettings");
                    if (!isTeamId && id in gameSettings) {
                        gameSettings[id] = value;
                    } else if (isTeamId && gameSettings.teams[team_order]) {
                        gameSettings.teams[team_order][id] = value;
                    }
                    updateGameSettings(gameSettings);
                    // e.target.focus();
                }}
                // value={currentValue || ""}
                defaultValue={currentValue || ""}
                w={props.width || "100%"}
            />
        </HStack>
    );
}

function SettingNumberInput(props) {
    let id = props.id;
    let [gameSettings] = fs.useWatch("gameSettings");

    let currentValue =
        id in gameSettings ? Number.parseInt(gameSettings[id]) : 0;

    let [numberValue, setNumberValue] = useState(currentValue);

    let isTeamId = "team_order" in props;
    let team_order = -1;
    if (isTeamId && gameSettings.teams && gameSettings.teams.length > 0) {
        team_order = Number.parseInt(props.team_order || 0);
        currentValue = Number.parseInt(gameSettings.teams[team_order][id]);
    }

    useEffect(() => {
        if (currentValue != numberValue) {
            setNumberValue(currentValue);
        }
    });

    return (
        <VStack key={"setting-" + id} id={"setting-" + id}>
            <Text
                as="label"
                display={"inline-block"}
                pr="0.5rem"
                color="gray.50"
                fontSize="1.2rem"
                htmlFor={id}
            >
                {props.title}
            </Text>
            <NumberInput
                className=""
                id={id}
                fontSize="1.4rem"
                bgColor="gray.950"
                aria-describedby=""
                readOnly={props.readOnly || false}
                isDisabled={props.readOnly || false}
                placeholder={props.placeholder}
                onChange={(value) => {
                    // let value = e.target.value;

                    try {
                        value = Number.parseInt(value) || 0;
                    } catch (e) {
                        value = 0;
                    }

                    if (props.onChange) props.onChange(id, value);

                    setNumberValue(value);

                    // fs.set(id, value);
                    let gameSettings = fs.get("gameSettings");
                    if (!isTeamId && id in gameSettings) {
                        gameSettings[id] = value;
                    } else if (isTeamId && gameSettings.teams[team_order]) {
                        gameSettings.teams[team_order][id] = value;
                    }

                    updateGameSettings(gameSettings);
                }}
                defaultValue={currentValue || 0}
                value={numberValue || 0}
                w={props.width || "100%"}
            >
                <NumberInputField fontSize="1.4rem" />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </VStack>
    );
}

export function ChooseScreenSettings(props) {
    try {
        let [gameSettings] = fs.useWatch("gameSettings");
        let [saved, setSaved] = useState(false);

        if (!gameSettings) return <></>;
        return (
            <Card>
                <CardHeader>
                    <Text fontWeight={"500"}>Screen Settings</Text>
                </CardHeader>
                <CardBody>
                    <VStack w="100%">
                        <VStack
                            w="100%"
                            bgColor="gray.900"
                            alignItems={"flex-start"}
                            px="2rem"
                        >
                            <Box
                                id="viewportscreentype"
                                display={
                                    gameSettings?.screentype == 1
                                        ? "none"
                                        : "block"
                                }
                                w="100%"
                            >
                                <Text
                                    as="label"
                                    display={"inline-block"}
                                    pr="0.5rem"
                                    fontWeight={"600"}
                                    color="gray.50"
                                    fontSize="1.4rem"
                                    htmlFor="screenType"
                                    pb="0.5rem"
                                >
                                    Screen Type
                                </Text>
                                <Select
                                    fontSize="xs"
                                    id="screenType"
                                    bgColor="gray.950"
                                    value={gameSettings?.screentype || "3"}
                                    onChange={(e) => {
                                        let val = Number.parseInt(
                                            e.target.value
                                        );

                                        if (!val) {
                                            console.error(
                                                "Invalid screentype value: ",
                                                val
                                            );
                                            return;
                                        }

                                        gameSettings.screentype = val;
                                        updateGameSettings(gameSettings);
                                    }}
                                >
                                    <option value="1">(1) Full Screen</option>
                                    <option value="2">
                                        (2) Fixed Resolution
                                    </option>
                                    <option value="3">
                                        (3) Scaled Resolution
                                    </option>
                                </Select>
                            </Box>
                            <Box
                                id="viewportResolution"
                                display={
                                    gameSettings?.screentype == 1
                                        ? "none"
                                        : "block"
                                }
                                pt="1rem"
                            >
                                <Text
                                    as="label"
                                    display={"inline-block"}
                                    pr="0.5rem"
                                    fontWeight={"600"}
                                    color="gray.50"
                                    fontSize="1.4rem"
                                    htmlFor="resolution"
                                >
                                    Resolution
                                </Text>
                                <HStack
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                >
                                    <SettingNumberInput
                                        id="resow"
                                        title=""
                                        placeholder="4"
                                    />
                                    <Text
                                        as="span"
                                        fontSize="2rem"
                                        alignSelf={"flex-end"}
                                    >
                                        :
                                    </Text>
                                    <SettingNumberInput
                                        id="resoh"
                                        title=""
                                        placeholder="3"
                                    />
                                </HStack>
                            </Box>
                            <Box
                                pt="1rem"
                                id="viewportSize"
                                display={
                                    gameSettings?.screentype != 3
                                        ? "none"
                                        : "block"
                                }
                            >
                                <Text
                                    as="label"
                                    display={"inline-block"}
                                    pr="0.5rem"
                                    fontWeight={"600"}
                                    color="gray.50"
                                    fontSize="1.4rem"
                                    htmlFor="screenwidth"
                                >
                                    Screen
                                </Text>
                                <HStack
                                    pt="0.5rem"
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                >
                                    <SettingNumberInput
                                        id="screenwidth"
                                        title="Width (px)"
                                        placeholder="800"
                                    />
                                    <Text
                                        as="span"
                                        fontSize="2rem"
                                        alignSelf={"flex-end"}
                                    >
                                        :
                                    </Text>
                                    <SettingNumberInput
                                        id="screenheight"
                                        title="Height"
                                        placeholder="600"
                                        readOnly={true}
                                    />
                                </HStack>
                            </Box>
                        </VStack>
                    </VStack>
                </CardBody>
            </Card>
        );
    } catch (err) {
        console.error(err);
        return <></>;
    }
}
