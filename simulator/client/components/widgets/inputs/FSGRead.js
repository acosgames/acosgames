import { HStack, Input, Text } from '@chakra-ui/react'
import { FormControl, FormLabel, FormHelperText } from "@chakra-ui/form-control";
import { updateGameField } from '../../../actions/notused/devgame';


function FSGRead(props) {

    // const inputChange = (e) => {
    //     let name = e.target.name;
    //     let value = e.target.value;

    //     updateGameField(name, value);
    // }

    return (
        <FormControl as='fieldset' mb="0">
            <FormLabel as='legend' fontSize={props.hfontSize || "xs"} color={props.hcolor || "gray.200"} fontWeight={props.hfontWeight || "bold"}>
                <HStack>
                    <Text>{props.title}</Text>
                    {props.required && (
                        <Text display="inline-block" color="red.800">*</Text>
                    )}
                </HStack>
            </FormLabel>
            <Text fontSize={props.fontSize} color={props.color || 'gray.300'}>{props.value}</Text>

            <FormHelperText>{props.helpText}</FormHelperText>


        </FormControl>
    )

}

export default FSGRead;