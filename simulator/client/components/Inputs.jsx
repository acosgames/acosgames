import { useBucket } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import {
    Box,
    HStack,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    Switch,
    Text,
    VStack,
} from "@chakra-ui/react";
import { updateGameSettings } from "../actions/websocket";
import { useEffect, useState } from "react";

export function SettingTextInput({
    id,
    title,
    width,
    textWidth,
    placeholder,
    helperText,
    maxLength,
    disabled,
    uppercase,
    regex,
    onChange,
    useTarget,
    useValue,
    useValidation,
}) {
    let gameSettings = useBucket(btGameSettings);
    let currentValue = useValue
        ? useValue(gameSettings, id)
        : gameSettings[id] || 0;

    return (
        <HStack
            key={"setting-" + id}
            id={"setting-" + id}
            display={gameSettings?.screentype == 1 ? "none" : "flex"}
            alignItems={"flex-start"}
            width="100%"
            spacing="0"
        >
            <Text
                fontWeight={"bold"}
                as="label"
                w={textWidth || "100%"}
                display={title ? "inline-block" : "none"}
                pr="0.5rem"
                pt="0.5rem"
                color="gray.50"
                fontSize="1.4rem"
                htmlFor={id}
            >
                {title}
            </Text>
            <VStack>
                <Input
                    className=""
                    id={id}
                    fontSize="1.4rem"
                    bgColor="gray.950"
                    aria-describedby=""
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLength || 255}
                    onChange={(e) => {
                        let value = e.target.value;
                        if (uppercase) value = value.toUpperCase();
                        if (regex) value = value.replace(regex, "");
                        if (onChange) onChange(id, value);
                        let gameSettings = btGameSettings.get();
                        if (useTarget) {
                            let shouldUpdate = useTarget(
                                gameSettings,
                                id,
                                value
                            );
                            if (shouldUpdate) updateGameSettings(gameSettings);
                        }
                    }}
                    value={currentValue || ""}
                    w={width || "100%"}
                />
                {helperText && (
                    <Text
                        fontWeight={"light"}
                        as="label"
                        display={"inline-block"}
                        pr="0.5rem"
                        color="gray.50"
                        fontSize="1.2rem"
                    >
                        {helperText}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
}

export function SettingSelectInput({
    id,
    title,
    options,
    width,
    textWidth,
    useValue,
    useTarget,
    onChange,
    helperText,
}) {
    let gameSettings = useBucket(btGameSettings);
    let currentValue = useValue
        ? useValue(gameSettings, id)
        : gameSettings[id] || 0;

    return (
        <HStack
            w="100%"
            key={"setting-" + id}
            id={"setting-" + id}
            display={gameSettings?.screentype == 1 ? "none" : "flex"}
            alignItems={"flex-start"}
            width="100%"
            spacing="0"
        >
            {title && (
                <Text
                    fontWeight={"bold"}
                    as="label"
                    w={textWidth || "100%"}
                    display={title ? "inline-block" : "none"}
                    pr="0.5rem"
                    pt="0.5rem"
                    color="gray.50"
                    fontSize="1.4rem"
                    htmlFor={id}
                >
                    {title}
                </Text>
            )}
            <Select
                fontSize="1.4rem"
                bgColor="gray.950"
                value={currentValue || 0}
                w={width || "20rem"}
                onChange={(e) => {
                    let value = e.target.value;
                    if (onChange) onChange(id, value);
                    let gameSettings = btGameSettings.get();

                    if (useTarget) {
                        let shouldUpdate = useTarget(gameSettings, id, value);
                        if (shouldUpdate) updateGameSettings(gameSettings);
                    }
                }}
            >
                {options.map((option) => (
                    <option
                        key={"select-" + option.text + option.value}
                        fontSize={"1rem"}
                        value={option.value}
                    >
                        {option.text}
                    </option>
                ))}
            </Select>
            {helperText && (
                <Text
                    fontWeight={"light"}
                    as="label"
                    display={"inline-block"}
                    pr="0.5rem"
                    color="gray.50"
                    fontSize="1.2rem"
                >
                    {helperText}
                </Text>
            )}
        </HStack>
    );
}

export function SettingNumberInput({
    id,
    title,
    helperText,
    defaultValue,
    readOnly,
    placeholder,
    width,
    textWidth,
    onChange,
    theme,
    useTarget,
    useValue,
}) {
    let gameSettings = useBucket(btGameSettings);
    let currentValue = useValue
        ? useValue(gameSettings, id)
        : gameSettings[id] || 0;

    if (theme == "row") {
        return (
            <HStack
                w="100%"
                key={"setting-" + id}
                id={"setting-" + id}
                display={gameSettings?.screentype == 1 ? "none" : "flex"}
                alignItems={"flex-start"}
                width="100%"
                spacing="0"
            >
                {title && (
                    <Text
                        fontWeight={"bold"}
                        as="label"
                        w={textWidth || "100%"}
                        display={title ? "inline-block" : "none"}
                        pr="0.5rem"
                        pt="0.5rem"
                        color="gray.50"
                        fontSize="1.4rem"
                        htmlFor={id}
                    >
                        {title}
                    </Text>
                )}
                <VStack>
                    <NumberInput
                        className=""
                        id={id}
                        fontSize="1.4rem"
                        bgColor="gray.950"
                        aria-describedby=""
                        readOnly={readOnly || false}
                        isDisabled={readOnly || false}
                        placeholder={placeholder}
                        onChange={(value) => {
                            try {
                                value = Number.parseInt(value) || 0;
                            } catch (e) {
                                value = 0;
                            }

                            if (onChange) onChange(id, value);

                            let gameSettings = btGameSettings.get();

                            if (useTarget) {
                                let shouldUpdate = useTarget(
                                    gameSettings,
                                    id,
                                    value
                                );
                                if (shouldUpdate)
                                    updateGameSettings(gameSettings);
                            }
                        }}
                        value={currentValue || 0}
                        w={width || "100%"}
                    >
                        <NumberInputField fontSize="1.4rem" />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    {helperText && (
                        <Text
                            fontWeight={"light"}
                            as="label"
                            display={"inline-block"}
                            pr="0.5rem"
                            color="gray.50"
                            fontSize="1.2rem"
                        >
                            {helperText}
                        </Text>
                    )}
                </VStack>
            </HStack>
        );
    }
    return (
        <VStack key={"setting-" + id} id={"setting-" + id}>
            <Text
                fontWeight={"500"}
                as="label"
                w={textWidth || "100%"}
                display={title ? "inline-block" : "none"}
                pr="0.5rem"
                color="gray.50"
                fontSize="1.2rem"
                textAlign={"center"}
                htmlFor={id}
            >
                {title}
            </Text>
            <NumberInput
                className=""
                id={id}
                fontSize="1.4rem"
                bgColor="gray.950"
                aria-describedby=""
                readOnly={readOnly || false}
                isDisabled={readOnly || false}
                placeholder={placeholder}
                onChange={(value) => {
                    try {
                        value = Number.parseInt(value) || 0;
                    } catch (e) {
                        value = 0;
                    }

                    if (onChange) onChange(id, value);

                    let gameSettings = btGameSettings.get();

                    if (useTarget) {
                        let shouldUpdate = useTarget(gameSettings, id, value);
                        if (shouldUpdate) updateGameSettings(gameSettings);
                    }
                }}
                value={currentValue || 0}
                w={width || "100%"}
            >
                <NumberInputField fontSize="1.4rem" />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
            {helperText && (
                <Text
                    fontWeight={"light"}
                    as="label"
                    display={"inline-block"}
                    pr="0.5rem"
                    color="gray.50"
                    fontSize="1.2rem"
                >
                    {helperText}
                </Text>
            )}
        </VStack>
    );
}

export function SettingSwitchInput({
    id,
    title,
    helperText,
    defaultValue,
    readOnly,
    placeholder,
    width,
    textWidth,
    onChange,
    useTarget,
    useValue,
}) {
    let gameSettings = useBucket(btGameSettings);
    let currentValue = useValue
        ? useValue(gameSettings, id)
        : gameSettings[id] || 0;

    return (
        <HStack
            w="100%"
            justifyContent={"flex-start"}
            alignItems={"flex-start"}
        >
            {title && (
                <Text
                    fontWeight={"bold"}
                    as="label"
                    w={textWidth || "100%"}
                    display={title ? "inline-block" : "none"}
                    pr="0.5rem"
                    pt="1rem"
                    color="gray.50"
                    fontSize="1.4rem"
                    htmlFor={id}
                >
                    {title}
                </Text>
            )}
            <VStack
                key={"setting-" + id}
                id={"setting-" + id}
                w="100%"
                justifyContent={"center"}
                pt="1rem"
            >
                <Box justifySelf={"center"}>
                    <Switch
                        className=""
                        id={id}
                        size={"lg"}
                        // fontSize="1.4rem"
                        // bgColor="gray.950"
                        aria-describedby=""
                        readOnly={readOnly || false}
                        isDisabled={readOnly || false}
                        placeholder={placeholder}
                        onChange={(e) => {
                            let value = e.target.checked;
                            if (onChange) onChange(id, value);
                            let gameSettings = btGameSettings.get();
                            if (useTarget) {
                                let shouldUpdate = useTarget(
                                    gameSettings,
                                    id,
                                    value
                                );
                                if (shouldUpdate)
                                    updateGameSettings(gameSettings);
                            }
                        }}
                        value={currentValue || 0}
                        w={width || "100%"}
                    />
                </Box>
                {helperText && (
                    <Text
                        fontWeight={"light"}
                        as="label"
                        display={"inline-block"}
                        pr="0.5rem"
                        color="gray.50"
                        fontSize="1.2rem"
                    >
                        {helperText}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
}
