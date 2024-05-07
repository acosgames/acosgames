import { HStack, Input, Select, Switch, Text } from "@chakra-ui/react";
import {
    FormControl,
    FormLabel,
    FormHelperText,
} from "@chakra-ui/form-control";
import { updateGameField } from "../../../actions/notused/devgame";
import { useEffect, useRef } from "react";
import fs from "flatstore";

function FSGSelect(props) {
    // const inputChange = (e) => {
    //     let name = e.target.name;
    //     let value = e.target.value;

    //     updateGameField(name, value);
    // }

    const inputRef = useRef();

    useEffect(() => {
        if (props.focus) {
            setTimeout(() => {
                inputRef?.current?.focus();
            }, props.focusDelay || 300);
        }
    }, []);

    let value = (props.group && props[props.group]) || props.value;
    return (
        <FormControl as="fieldset" mb="0">
            <FormLabel
                as="legend"
                fontSize="xs"
                color="gray.100"
                fontWeight="bold"
            >
                <HStack>
                    <Text>{props.title}</Text>
                    {props.required && (
                        <Text display="inline-block" color="red.800">
                            *
                        </Text>
                    )}
                </HStack>
            </FormLabel>

            <Select
                id={props.id}
                name={props.name}
                bgColor="gray.1000"
                ref={props.ref || inputRef}
                value={value}
                onChange={(e) => {
                    if (props.rules && props.group) {
                        updateGameField(
                            props.name,
                            e.target.value,
                            props.rules,
                            props.group,
                            props.error
                        );
                    }
                    props.onChange(e);
                }}
                placeholder={props.placeholder}
                w={props.w || props.width}
                // defaultValue={props.defaultValue}
                disabled={props.disabled}
                onFocus={props.onFocus}
            >
                {props.options}
            </Select>

            {/* <Input
                name={props.name}
                id={props.id}
                ref={props.ref || inputRef}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                value={props.value || ''}
                size={props.size}
                width={props.width}
                onKeyDown={props.onKeyDown}
                onChange={props.onChange}
                onFocus={props.onFocus}
                disabled={props.disabled}
                bgColor="gray.800"
            /> */}

            <FormHelperText>{props.helpText}</FormHelperText>
        </FormControl>
    );
}

let onCustomWatched = (ownProps) => {
    if (ownProps.group) return [ownProps.group];
    return [];
};
let onCustomProps = (key, value, store, ownProps) => {
    // if (key == (ownProps.group + '>' + ownProps.name))
    //     return { [key]: value }
    return { [ownProps.id]: value };
};

export default fs.connect([], onCustomWatched, onCustomProps)(FSGSelect);
