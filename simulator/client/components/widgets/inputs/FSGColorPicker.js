import { Button, HStack, IconButton, Input, Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader, PopoverTrigger, Text, Tooltip, VStack } from '@chakra-ui/react'
import { FormControl, FormLabel, FormHelperText } from "@chakra-ui/form-control";
import { updateGameField } from '../../../actions/notused/devgame';
import { useEffect, useRef, useState } from 'react';

import { IoColorPaletteSharp } from '@react-icons';
import { SketchPicker } from 'react-color';
const regexColorHex = /^#([0-9a-fA-F]{3}){1,2}$/i;
import fs from 'flatstore';

function FSGColorPicker(props) {

    // const inputChange = (e) => {
    //     let name = e.target.name;
    //     let value = e.target.value;

    //     updateGameField(name, value);
    // }

    // const inputRef = useRef();

    let defaultValue = props.value;
    if (!regexColorHex.test(defaultValue))
        defaultValue = '#f00';

    let [colorValue, setColorValue] = useState(defaultValue);

    useEffect(() => {


        if (!regexColorHex.test(props.value)) {
            if (props.rules && props.group) {
                updateGameField(props.name, '#f00', props.rules, props.group, props.error);
            }
            props.onChange('#f00');
        }
        // if (props.focus) {
        //     setTimeout(() => {
        //         inputRef?.current?.focus();
        //     }, props.focusDelay || 300)
        // }

    }, [])

    let timeoutHandle = 0;
    let lastUpdate = Date.now();

    let value = (props.group && props[props.group]) || colorValue;

    return (

        <VStack h="100%" flex="1">


            {/* <Input
                    onChange={(e) => {

                        let now = Date.now();
                        let hex = e.value;
                        if (timeoutHandle) {
                            clearTimeout(timeoutHandle);
                            timeoutHandle = 0;
                        }

                        if (!regexColorHex.test(hex)) {
                            timeoutHandle = setTimeout(() => {
                                let hex = props.value;
                                if (!regexColorHex.test(hex)) {
                                    hex = '#F00';
                                }

                                props.onChange(hex);
                                setColorValue(hex);
                            }, 3000)
                        }


                        props.onChange(hex);
                        setColorValue(hex);

                    }}
                    autoComplete={props.autoComplete}
                    bgColor={colorValue || "brand.500"}
                    // _hover={props._hover || { bg: "brand.600" }}
                    // _active={props._active || { bg: "brand.900" }}
                    width={props.width}
                    height={props.height}
                    fontWeight={props.fontWeight}
                    fontSize={props.fontSize}
                    value={colorValue}
                    textShadow={'2px 2px #000'}
                    color={props.color || 'white'}
                /> */}

            <Popover flex="1" h="100%" outline={'none'} _active={{ outline: 'none' }} bgColor={'transparent'}>
                <PopoverTrigger h="100%">
                    <Button
                        flex="1"
                        fontWeight={props.fontWeight}
                        fontSize={props.fontSize}
                        value={value}
                        textShadow={'2px 2px #000'}
                        color={'white'}
                        bgColor={value || "brand.500"}
                        h={props.height || "100%"}
                        w={props.width || '100%'}
                    >
                        {value || '#f00'}
                    </Button>
                    {/* <IconButton
                            icon={<IoColorPaletteSharp />}
                            size="sm"
                            isRound="true"
                        /> */}
                </PopoverTrigger>
                <PopoverContent border="0" outline={'none'} _focus={{ outline: 'none' }} _active={{ outline: 'none' }} bgColor={'transparent'}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody outline={'none'} _active={{ outline: 'none' }} bgColor={'transparent'}>
                        <SketchPicker
                            color={value || '#f00'}
                            onChange={(color) => {
                                if (props.rules && props.group) {
                                    updateGameField(props.name, color.hex, props.rules, props.group, props.error);
                                }

                                props.onChange(color.hex);
                                setColorValue(color.hex);
                            }}
                        />
                    </PopoverBody>
                </PopoverContent>
            </Popover>

        </VStack>
    )

}


let onCustomWatched = ownProps => {
    if (ownProps.group)
        return [ownProps.group];
    return [];
};
let onCustomProps = (key, value, store, ownProps) => {
    // if (key == (ownProps.group + '>' + ownProps.name))
    //     return { [key]: value }
    return { [ownProps.id]: value };
};

export default fs.connect([], onCustomWatched, onCustomProps)(FSGColorPicker);
