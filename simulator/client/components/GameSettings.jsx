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

import { FaArrowCircleUp, FaArrowCircleDown } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
// import { SketchPicker } from "react-color";
import { AnimatePresence, motion } from "framer-motion";

import { ColorPicker, Hue, Saturation, useColor } from "react-color-palette";
import "react-color-palette/css";
import { useBucket } from "react-bucketjs";
import {
    btGameSettings,
    btPrevGameSettings,
    btTeamSettingsRef,
    btWebsocketStatus,
} from "../actions/buckets";
import { SettingNumberInput, SettingTextInput } from "./Inputs";

const MotionBox = motion(Box);

export function Settings(props) {
    let gameSettings = useBucket(btGameSettings);
    let wsStatus = useBucket(btWebsocketStatus);
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
    const useGameTarget = (gameSettings, id, value) => {
        gameSettings[id] = value;
        return true;
    };
    const useGameValue = (gameSettings, id) => gameSettings[id];
    return (
        <Card>
            <CardHeader>
                <Text fontWeight={"500"}>Game Settings</Text>
            </CardHeader>
            <CardBody pt="0">
                <VStack>
                    <VStack
                        //  bgColor="gray.900"
                        px="2rem"
                    >
                        <HStack spacing="1rem" alignItems={"flex-end"}>
                            <Text w="6rem" color="gray.50" fontWeight={"600"}>
                                Players
                            </Text>
                            <SettingNumberInput
                                id="minplayers"
                                title="Min"
                                placeholder="0"
                                useTarget={useGameTarget}
                                useValue={useGameValue}
                            />
                            <SettingNumberInput
                                id="maxplayers"
                                title="Max"
                                placeholder="0"
                                useTarget={useGameTarget}
                                useValue={useGameValue}
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
                                useTarget={useGameTarget}
                                useValue={useGameValue}
                            />
                            <SettingNumberInput
                                id="maxteams"
                                title="Max"
                                placeholder="0"
                                useTarget={useGameTarget}
                                useValue={useGameValue}
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

    let gameSettings = useBucket(btGameSettings);

    const renderTeams = () => {
        let teams = gameSettings.teams;
        if (!teams || teams.length == 0) {
            return <></>;
        }

        // let teamList = Object.keys(teams);
        // teams.sort((a, b) => {
        //     return a.team_order - b.team_order;
        // });
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
        btTeamSettingsRef.set(teamSettingsRef);
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
    let [active, setActive] = useState(false);

    const onChangeOrder = (dir) => {
        let gameSettings = btGameSettings.get();
        let teams = gameSettings.teams;

        teams.sort((a, b) => {
            return a.team_order - b.team_order;
        });

        let activeTeam = teams[props.team_order];
        let otherTeam = teams[props.team_order + dir];
        let otherTeamOrder = otherTeam.team_order;
        let activeTeamOrder = activeTeam.team_order;
        otherTeam.team_order = activeTeamOrder;
        activeTeam.team_order = otherTeamOrder;

        teams.sort((a, b) => {
            return a.team_order - b.team_order;
        });

        updateGameSettings(gameSettings);
        setActive(true);
        setTimeout(() => {
            setActive(false);
        }, 1000);
    };

    let gameSettings = btGameSettings.get();
    let teams = gameSettings.teams;

    let isUpActive = teams && props.team_order > 0;
    let isDownActive = teams && props.team_order < teams.length - 1;

    const useTeamTarget = (gameSettings, id, value) => {
        let teams = gameSettings.teams;
        if (!teams) return false;
        let team = teams[props.team_order];
        if (!team) return false;
        team[id] = value;
        return true;
    };

    const useTeamValue = (gameSettings, id) => {
        let teams = gameSettings.teams;
        if (!teams) return;
        let team = teams[props.team_order];
        if (!team) return;
        return team[id];
    };
    return (
        <MotionBox
            layout
            transition={{ duration: 1 }}
            pt="2rem"
            pb="2rem"
            // bgColor={active ? "gray.750" : "gray.775"}
            _hover={{ bgColor: "gray.600" }}
            borderTop={"1px solid"}
            borderTopColor={"gray.600"}
        >
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
                        useTarget={useTeamTarget}
                        useValue={useTeamValue}
                    />
                    <VStack w="100%" spacing="0">
                        <SettingTextInput
                            id="team_slug"
                            title="Slug"
                            textWidth="6rem"
                            team_order={props.team_order}
                            useTarget={useTeamTarget}
                            useValue={useTeamValue}
                        />

                        <HStack w="100%" pt="1rem">
                            <SettingNumberInput
                                id="minplayers"
                                title="Min Players"
                                team_order={props.team_order}
                                useTarget={useTeamTarget}
                                useValue={useTeamValue}
                            />
                            <SettingNumberInput
                                id="maxplayers"
                                title="Max Players"
                                team_order={props.team_order}
                                useTarget={useTeamTarget}
                                useValue={useTeamValue}
                            />
                        </HStack>
                    </VStack>
                    <Box w="100%" h="3rem">
                        <SettingColorInput
                            id="color"
                            title=""
                            team_order={props.team_order}
                            useTarget={useTeamTarget}
                            useValue={useTeamValue}
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
    let gameSettings = btGameSettings.get();

    let currentValue = id in gameSettings ? gameSettings[id] : 0;

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

            let gameSettings = btGameSettings.get();
            if (!isTeamId && id in gameSettings) {
                gameSettings[id] = value;
            } else if (isTeamId && gameSettings.teams[team_order]) {
                gameSettings.teams[team_order][id] = value;
            }
            updateGameSettings(gameSettings);
        }
    }, []);

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
                        <ColorPicker
                            color={color || "#f00"}
                            onChange={(c1) => {
                                let value = c1.hex;
                                let gameSettings = btGameSettings.get();
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
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </VStack>
    );
}

export function ChooseScreenSettings(props) {
    try {
        let gameSettings = useBucket(btGameSettings);

        const useGameTarget = (gameSettings, id, value) => {
            gameSettings[id] = value;
            return true;
        };
        const useGameValue = (gameSettings, id) => gameSettings[id];

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
                            // bgColor="gray.900"
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
                                        useTarget={useGameTarget}
                                        useValue={useGameValue}
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
                                        useTarget={useGameTarget}
                                        useValue={useGameValue}
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
                                        useTarget={useGameTarget}
                                        useValue={useGameValue}
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
                                        useTarget={useGameTarget}
                                        useValue={useGameValue}
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
