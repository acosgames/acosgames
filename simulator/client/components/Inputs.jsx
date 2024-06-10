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

import Creatable from "react-select/creatable";

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
            mb="0.5rem"
        >
            <Text
                fontWeight="500"
                as="label"
                w={textWidth || "100%"}
                display={title ? "inline-block" : "none"}
                pr="0.5rem"
                pt="0.5rem"
                color="gray.20"
                fontSize="1.4rem"
                htmlFor={id}
            >
                {title}
            </Text>
            <VStack spacing="0">
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
                    h={"3rem"}
                />
                {helperText && (
                    <Text
                        fontWeight={"light"}
                        as="label"
                        display={"inline-block"}
                        pr="0.5rem"
                        color="gray.20"
                        fontSize="1.2rem"
                        w="100%"
                        pl="1rem"
                    >
                        {helperText}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
}

export function SettingCreatableInput({
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

    currentValue = { label: currentValue, value: currentValue };

    return (
        <HStack
            w="100%"
            key={"setting-" + id}
            id={"setting-" + id}
            display={gameSettings?.screentype == 1 ? "none" : "flex"}
            alignItems={"flex-start"}
            width="100%"
            spacing="0"
            mb="0.5rem"
        >
            {title && (
                <Text
                    fontWeight="500"
                    as="label"
                    w={textWidth || "100%"}
                    display={title ? "inline-block" : "none"}
                    pr="0.5rem"
                    pt="0.5rem"
                    color="gray.20"
                    fontSize="1.4rem"
                    htmlFor={id}
                >
                    {title}
                </Text>
            )}
            <VStack spacing="0" w={width || "20rem"}>
                <Creatable
                    options={options}
                    isMulti={false}
                    value={currentValue || 0}
                    onChange={(e) => {
                        let value = e.value; // e.target.value;
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
                    styles={{
                        container: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.4rem",
                            // color: "var(--chakra-colors-gray-10)",
                            // backgroundColor: "var(--chakra-colors-gray.950)",
                            width: width || "20rem",
                        }),

                        valueContainer: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.2rem",
                            // paddingLeft: "1rem",
                            // color: "var(--chakra-colors-gray-10)",
                            backgroundColor: "var(--chakra-colors-gray-950)",
                        }),
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.2rem",
                            minHeight: "1.5rem",
                            border: "none",
                            outline: "none",
                            ":active": {
                                border: "none",
                                boxShadow: "0 0 0 black !important",
                            },
                            ":hover": {
                                border: "none",
                                boxShadow: "0 0 0 black !important",
                            },
                            ":focus": {
                                outline: "none",
                                border: "none",
                                boxShadow: "0 0 0 black !important",
                            },
                            // color: "var(--chakra-colors-gray-10)",
                            backgroundColor: "var(--chakra-colors-gray-950)",
                            // width: width || "20rem",
                        }),
                        singleValue: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.4rem",
                            fontWeight: 400,
                            color: "var(--chakra-colors-gray-20)",

                            // backgroundColor: "var(--chakra-colors-gray-700)",
                        }),
                        input: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.2rem",
                            color: "var(--chakra-colors-gray-200)",
                            // paddingRight: "1rem",
                            // backgroundColor: "var(--chakra-colors-gray-950)",
                            // width: width || "20rem",
                        }),
                        placeholder: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.2rem",
                            // color: "var(--chakra-colors-gray-100)",
                            backgroundColor: "var(--chakra-colors-gray-950)",
                            // width: width || "20rem",
                        }),
                        option: (baseStyles, state) => ({
                            ...baseStyles,
                            fontSize: "1.2rem",
                            borderLeft: state.isSelected
                                ? "3px solid var(--chakra-colors-brand-300)"
                                : "0",
                            backgroundColor: "var(--chakra-colors-gray-700)",
                            hover: {
                                backgroundColor:
                                    "var(--chakra-colors-gray-700)",
                            },
                            focus: {
                                backgroundColor:
                                    "var(--chakra-colors-gray-700)",
                            },
                        }),
                        menu: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: "var(--chakra-colors-gray-700)",
                        }),
                        menuList: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: "var(--chakra-colors-gray-700)",
                        }),
                    }}
                >
                    {/* {options.map((option) => (
                        <option
                            key={"select-" + option.label + option.value}
                            fontSize={"1rem"}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))} */}
                </Creatable>
                {helperText && (
                    <Text
                        fontWeight={"light"}
                        as="label"
                        display={"inline-block"}
                        pr="0.5rem"
                        color="gray.20"
                        fontSize="1.2rem"
                        w="100%"
                        pl="1rem"
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
            mb="0.5rem"
        >
            {title && (
                <Text
                    fontWeight="500"
                    as="label"
                    w={textWidth || "100%"}
                    display={title ? "inline-block" : "none"}
                    pr="0.5rem"
                    pt="0.5rem"
                    color="gray.20"
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
                    color="gray.20"
                    fontSize="1.2rem"
                    w="100%"
                    pl="1rem"
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
                mb="0.5rem"
            >
                {title && (
                    <Text
                        fontWeight="500"
                        as="label"
                        w={textWidth || "100%"}
                        display={title ? "inline-block" : "none"}
                        pr="0.5rem"
                        pt="0.5rem"
                        color="gray.20"
                        fontSize="1.4rem"
                        htmlFor={id}
                    >
                        {title}
                    </Text>
                )}
                <VStack spacing="0">
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

                        // h={"3rem"}
                    >
                        <NumberInputField h="3rem" fontSize="1.4rem" />
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
                            color="gray.20"
                            fontSize="1.2rem"
                            w="100%"
                            pl="1rem"
                        >
                            {helperText}
                        </Text>
                    )}
                </VStack>
            </HStack>
        );
    }
    return (
        <VStack key={"setting-" + id} id={"setting-" + id} spacing="0">
            <Text
                fontWeight={"500"}
                as="label"
                w={textWidth || "100%"}
                display={title ? "inline-block" : "none"}
                pr="0.5rem"
                color="gray.20"
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
                // h={"3rem"}
            >
                <NumberInputField h="3rem" fontSize="1.4rem" />
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
                    color="gray.20"
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
                    fontWeight="500"
                    as="label"
                    w={textWidth || "100%"}
                    display={title ? "inline-block" : "none"}
                    pr="0.5rem"
                    pt="1rem"
                    color="gray.20"
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
                justifyContent={"flex-start"}
                alignItems={"flex-start"}
                pt="1rem"
                spacing="0"
            >
                <Box justifySelf={"flex-start"}>
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
                        h={"3rem"}
                    />
                </Box>
                {helperText && (
                    <Text
                        fontWeight={"light"}
                        as="label"
                        display={"inline-block"}
                        pr="0.5rem"
                        color="gray.20"
                        fontSize="1.2rem"
                        w="100%"
                        // pl="1rem"
                    >
                        {helperText}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
}
