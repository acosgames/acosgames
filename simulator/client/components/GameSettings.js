import { Box, Button, Grid, HStack, IconButton, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverTrigger, Select, Text, VStack, Wrap } from "@chakra-ui/react";
import { updateGameSettings } from "../actions/websocket";
import fs from 'flatstore';

import { FaArrowCircleUp, FaArrowCircleDown } from '@react-icons';
import { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";

export function ChooseGameSettings(props) {


    return (
        <VStack>
            <HStack spacing="1rem" alignItems={'flex-end'}>
                <Text w="6rem">Players</Text>
                <SettingNumberInput id="minplayers" title="Min" placeholder="0" />
                <SettingNumberInput id="maxplayers" title="Max" placeholder="0" />
            </HStack>
            <HStack spacing="1rem" alignItems={'flex-end'}>
                <Text w="6rem">Teams</Text>
                <SettingNumberInput id="minteams" title="Min" placeholder="0" />
                <SettingNumberInput id="maxteams" title="Max" placeholder="0" />
            </HStack>
        </VStack>
    )
}

export function ChooseTeamSettings(props) {

    let [gameSettings] = fs.useWatch('gameSettings');

    const renderTeams = () => {

        let teams = gameSettings.teams;
        if (!teams || teams.length == 0) {
            return <></>
        }

        let elems = [];
        for (let i = 0; i < teams.length; i++) {
            elems.push(<TeamSettings key={'key_' + teams[i].team_slug} team_order={i} />);
        }

        return elems;
    }

    return (
        <Box>
            {renderTeams()}
        </Box>
    )
}


function TeamSettings(props) {

    const teamRef = useRef();
    let [offset, setOffset] = useState(null);
    let [active, setActive] = useState(false);


    const arraymove = (arr, fromIndex, toIndex) => {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }

    const getOffset = (el) => {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
        };
    }

    const onChangeOrder = (dir) => {
        let gameSettings = fs.get('gameSettings');
        let teams = gameSettings.teams;

        let newIndex = (props.team_order + dir);
        if (newIndex < 0)
            return;
        if (newIndex >= teams.length)
            return;


        arraymove(teams, props.team_order, newIndex);

        for (let i = 0; i < teams.length; i++) {
            if (teams[i].team_order != i) {
                teams[i].team_order = i;
            }
        }

        updateGameSettings(gameSettings);
        setActive(true);
        setTimeout(() => {
            setActive(false);
        }, 1000)
    }

    useEffect(() => {
        setOffset(getOffset(teamRef.current));
    }, [])

    useEffect(() => {
        if (active) {
            let newOffset = getOffset(teamRef.current);
            let yDiff = newOffset.top - offset.top;

            teamRef.current.scrollIntoView();

            if (newOffset.top != offset.top) {
                setOffset(newOffset);
            }
        }

    })

    let gameSettings = fs.get('gameSettings');
    let teams = gameSettings.teams;

    let isUpActive = (teams && (props.team_order > 0));
    let isDownActive = (teams && (props.team_order < teams.length - 1))

    return (
        <Box ref={teamRef} pt="2rem" pb="2rem" transition={'background 0.3s ease'} bgColor={active ? 'gray.600' : ''} _hover={{ bgColor: 'gray.700' }} borderTop={'1px solid'} borderTopColor={'gray.600'}>
            {/* <Grid templateColumns='80% 20%' bgColor={props.isOdd ? 'gray.900' : ''} w="100%" > */}
            <VStack spacing="0">
                <SettingTextInput id="team_name" team_order={props.team_order} />

                <HStack spacing="0">
                    <HStack spacing="0">

                        <VStack spacing="1rem" justifyContent={'center'} alignContent="center">
                            <IconButton
                                color={isUpActive ? 'gray.300' : 'gray.600'}
                                _hover={{ color: isUpActive ? 'white' : 'gray.600' }}
                                _active={{ color: isUpActive ? 'gray.100' : 'gray.600' }}
                                onClick={() => {
                                    if (!isUpActive)
                                        return;
                                    onChangeOrder(-1);
                                }}
                                cursor={isUpActive ? 'pointer' : ''}
                                icon={<FaArrowCircleUp size="2rem" />}
                                width="2.8rem"
                                height="2.8rem"
                                isRound="true"
                            />
                            <Text color="white" fontSize="xs" fontWeight={"bold"}>{props.team_order}</Text>
                            <IconButton
                                color={isDownActive ? 'gray.300' : 'gray.600'}
                                cursor={isDownActive ? 'pointer' : ''}
                                onClick={() => {
                                    if (!isDownActive)
                                        return;
                                    onChangeOrder(1);
                                }}
                                _hover={{ color: isDownActive ? 'white' : 'gray.600' }}
                                _active={{ color: isDownActive ? 'gray.100' : 'gray.600' }}
                                icon={<FaArrowCircleDown size="2rem" />}
                                width="2.8rem"
                                height="2.8rem"
                                isRound="true"
                            />
                        </VStack>
                        <Wrap width="100%" px="2rem">

                            <VStack w="100%">

                                <SettingTextInput id="team_slug" title="Slug" team_order={props.team_order} />
                            </VStack>
                            <HStack w="100%">
                                <SettingNumberInput id="minplayers" title="Min Players" team_order={props.team_order} />
                                <SettingNumberInput id="maxplayers" title="Max Players" team_order={props.team_order} />
                            </HStack>
                        </Wrap>
                    </HStack>
                    <Box pt="3rem" pb="3rem">
                        <SettingColorInput id="color" title="" team_order={props.team_order} />

                    </Box>
                </HStack>
            </VStack>
        </Box>
    )
}

const regexColorHex = /^#([0-9a-fA-F]{3}){1,2}$/i;

function SettingColorInput(props) {
    let id = props.id;
    let [gameSettings] = fs.useWatch('gameSettings');
    let currentValue = (id in gameSettings) ? gameSettings[id] : 0;

    let isTeamId = 'team_order' in props;
    let team_order = -1;
    if (isTeamId) {
        team_order = Number.parseInt(props.team_order || 0);
        currentValue = gameSettings.teams[team_order][id];
    }

    if (!regexColorHex.test(currentValue))
        currentValue = '#f00';
    let [colorValue, setColorValue] = useState(currentValue);

    useEffect(() => {

        if (!regexColorHex.test(currentValue)) {
            let value = '#000000';

            if (props.onChange)
                props.onChange(id, value);

            let gameSettings = fs.get('gameSettings');
            if (!isTeamId && (id in gameSettings)) {
                gameSettings[id] = value;
            } else if (isTeamId && gameSettings.teams[team_order]) {
                gameSettings.teams[team_order][id] = value;
            }
            updateGameSettings(gameSettings);

        }
    }, [])

    let timeoutHandle = 0;
    let lastUpdate = Date.now();

    // let value = (props.group && props[props.group]) || colorValue;

    return (

        <VStack h="100%" flex="1">

            <Popover flex="1" h="100%" outline={'none'} _active={{ outline: 'none' }} bgColor={'transparent'}>
                <PopoverTrigger h="100%">
                    <Button
                        flex="1"
                        fontWeight={props.fontWeight}
                        fontSize={props.fontSize || '1rem'}
                        value={currentValue}
                        textShadow={'2px 2px #000'}
                        color={'white'}
                        bgColor={currentValue || "brand.500"}
                        h={props.height || "100%"}
                        w={props.width || '100%'}
                    >
                        {currentValue || '#f00'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent border="0" outline={'none'} _focus={{ outline: 'none' }} _active={{ outline: 'none' }} bgColor={'transparent'}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody outline={'none'} _active={{ outline: 'none' }} bgColor={'transparent'}>
                        <SketchPicker
                            color={currentValue || '#f00'}
                            onChange={(color) => {

                                let value = color.hex;

                                if (props.onChange)
                                    props.onChange(id, value);

                                let gameSettings = fs.get('gameSettings');
                                if (!isTeamId && (id in gameSettings)) {
                                    gameSettings[id] = value;
                                } else if (isTeamId && gameSettings.teams[team_order]) {
                                    gameSettings.teams[team_order][id] = value;
                                }
                                updateGameSettings(gameSettings);
                                setColorValue(value);
                            }}
                        />
                    </PopoverBody>
                </PopoverContent>
            </Popover>

        </VStack>
    )
}

function SettingTextInput(props) {
    let id = props.id;
    let [gameSettings] = fs.useWatch('gameSettings');
    let currentValue = (id in gameSettings) ? gameSettings[id] : 0;

    let isTeamId = 'team_order' in props;
    let team_order = -1;
    if (isTeamId && gameSettings.teams && gameSettings.teams.length > 0) {
        team_order = Number.parseInt(props.team_order || 0);
        currentValue = gameSettings.teams[team_order][id];
    }

    return (
        <HStack id={'setting-' + id} display={gameSettings?.screentype == 1 ? 'none' : 'flex'} alignItems={'flex-start'} width="100%">
            <Text fontWeight={'bold'} as="label" display={props.title ? 'inline-block' : 'none'} pr="0.5rem" fontSize="xs" htmlFor={id}>{props.title}</Text>
            <Input
                className=""
                id={id}
                fontSize="xs"
                aria-describedby=""
                placeholder={props.placeholder}
                onChange={(e) => {
                    let value = e.target.value;

                    if (props.onChange)
                        props.onChange(id, value);

                    // if( !('team_order' in props) ) {
                    //     fs.set(id, value);
                    // }

                    let gameSettings = fs.get('gameSettings');
                    if (!isTeamId && (id in gameSettings)) {
                        gameSettings[id] = value;
                    } else if (isTeamId && gameSettings.teams[team_order]) {
                        gameSettings.teams[team_order][id] = value;
                    }
                    updateGameSettings(gameSettings);
                }}
                value={currentValue}
                w={props.width || "100%"}
            />
        </HStack>
    )
}

function SettingNumberInput(props) {

    let id = props.id;
    let [gameSettings] = fs.useWatch('gameSettings');
    let currentValue = (id in gameSettings) ? Number.parseInt(gameSettings[id]) : 0;

    let isTeamId = 'team_order' in props;
    let team_order = -1;
    if (isTeamId && gameSettings.teams && gameSettings.teams.length > 0) {
        team_order = Number.parseInt(props.team_order || 0)
        currentValue = Number.parseInt(gameSettings.teams[team_order][id]);
    }

    return (
        <VStack id={'setting-' + id}>
            <Text as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor={id}>{props.title}</Text>
            <NumberInput
                className=""
                id={id}
                fontSize="xs"
                aria-describedby=""
                placeholder={props.placeholder}
                onChange={(value) => {
                    // let value = e.target.value;

                    try {
                        value = Number.parseInt(value) || 0;
                    }
                    catch (e) {
                        value = 0;
                    }

                    if (props.onChange)
                        props.onChange(id, value);

                    // fs.set(id, value);
                    let gameSettings = fs.get('gameSettings');
                    if (!isTeamId && (id in gameSettings)) {
                        gameSettings[id] = value;
                    } else if (isTeamId && gameSettings.teams[team_order]) {
                        gameSettings.teams[team_order][id] = value;
                    }

                    updateGameSettings(gameSettings);
                }}
                value={currentValue}
                w={props.width || "100%"}
            >
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </VStack>
    )
}


export function ChooseScreenSettings(props) {

    try {
        let [gameSettings] = fs.useWatch('gameSettings');

        if (!gameSettings)
            return <></>
        return (
            <div>
                <div>

                    <Select
                        fontSize="xs"
                        id="screenType"
                        value={gameSettings?.screentype || '3'}
                        onChange={(e) => {
                            let val = Number.parseInt(e.target.value);

                            if (!val) {
                                console.error("Invalid screentype value: ", val);
                                return;
                            }

                            gameSettings.screentype = val;
                            updateGameSettings(gameSettings);
                        }}
                    >
                        <option value="1">(1) Full Screen</option>
                        <option value="2">(2) Fixed Resolution</option>
                        <option value="3">(3) Scaled Resolution</option>
                    </Select>
                </div>
                <Box id="viewportResolution" display={gameSettings?.screentype == 1 ? 'none' : 'block'}>
                    <Text as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="resolution">Resolution</Text>
                    <Input
                        type="text"
                        className=""
                        id="resolution"
                        fontSize="xs"
                        aria-describedby=""
                        placeholder="4:3"
                        onChange={(e) => {
                            let parts = e.target.value.split(':');
                            if (parts.length != 2) {
                                console.log("Invalid format for resolution, please use #:# format", e.target.value);
                                return;
                            }

                            try {
                                let resow = Number.parseInt(parts[0]) || 0;
                                let resoh = Number.parseInt(parts[1]) || 0;

                                if (!resow || !resoh) {
                                    console.error("Invalid resolution values: ", resow + ':' + resoh);
                                    return;
                                }

                                gameSettings.resow = resow;
                                gameSettings.resoh = resoh;
                                updateGameSettings(gameSettings);
                            }
                            catch (e) {

                            }

                        }}
                        value={gameSettings?.resow && (gameSettings?.resow + ':' + gameSettings?.resoh)}
                        w="6rem"
                    />
                </Box>
                <Box id="viewportSize" display={gameSettings?.screentype != 3 ? 'none' : 'block'}>
                    <Text as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="maxwidth">Width (px)</Text>
                    <Input
                        type="text"
                        className=""
                        id="maxwidth"
                        aria-describedby=""
                        value={gameSettings?.screenwidth || '800'}
                        onChange={(e) => {
                            let val = Number.parseInt(e.target.value);

                            if (!val) {
                                console.error("Invalid max width value: ", val);
                                return;
                            }

                            gameSettings.screenwidth = val;
                            updateGameSettings(gameSettings);
                        }}
                        placeholder={gameSettings?.screenwidth || '800'}
                        w="6rem"
                        fontSize="xs"
                    />
                    <Text color="gray.500" as="label" display={'inline-block'} pr="0.5rem" fontSize="xs" htmlFor="maxheight">Height (px)</Text>
                    <Input
                        type="text"
                        className=""
                        id="maxheight"
                        readOnly
                        aria-describedby=""
                        color="gray.500"
                        fontSize="xs"
                        value={gameSettings?.screenwidth && (gameSettings?.screenwidth * (gameSettings.resoh / gameSettings.resow))}
                        w="6rem"
                    />
                </Box>
            </div>
        )
    }
    catch (err) {
        console.error(err);
        return <></>
    }


}