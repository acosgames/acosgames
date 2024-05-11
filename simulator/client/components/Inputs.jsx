import { useBucket } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import {
    HStack,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Text,
    VStack,
} from "@chakra-ui/react";
import { updateGameSettings } from "../actions/websocket";
import { useEffect, useState } from "react";

export function SettingTextInput(props) {
    let id = props.id;
    let gameSettings = useBucket(btGameSettings);
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

                    let gameSettings = btGameSettings.get();
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

export function SettingNumberInput(props) {
    let id = props.id;
    let gameSettings = useBucket(btGameSettings);

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

                    let gameSettings = btGameSettings.get();
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
