import {
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Text,
    HStack,
} from '@chakra-ui/react'
import { FormControl, FormLabel, FormHelperText } from "@chakra-ui/form-control";
import { updateGameField } from '../../../actions/notused/devgame';
import fs from 'flatstore';

function FSGNumberInput(props) {

    let value = (props.group && props[props.group]) || props.value;
    return (
        <FormControl as='fieldset' mb="0">
            <FormLabel as='legend' fontSize="xs" color="gray.100" fontWeight="bold">
                <HStack>
                    <Text>{props.title}</Text>
                    {props.required && (
                        <Text display="inline-block" color="red.800">*</Text>
                    )}
                </HStack>
            </FormLabel>

            <NumberInput
                // defaultValue={2} 
                min={props.min}
                max={props.max}
                name={props.name}
                id={props.id}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                value={value || ''}
                size={props.size || 'md'}
                onChange={(e) => {
                    if (props.rules && props.group) {
                        updateGameField(props.name, Number.parseInt(e), props.rules, props.group, props.error);
                    }
                    props.onChange(e);
                }}
                disabled={props.disabled}
                bgColor="gray.800"
            >
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>

            <FormHelperText>{props.helpText}</FormHelperText>


        </FormControl>
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

export default fs.connect([], onCustomWatched, onCustomProps)(FSGNumberInput);
