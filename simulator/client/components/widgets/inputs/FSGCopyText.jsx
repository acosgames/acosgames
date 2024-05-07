import { HStack, Input, Text } from '@chakra-ui/react'
import { FormControl, FormLabel, FormHelperText } from "@chakra-ui/form-control";
import { updateGameField } from '../../../actions/notused/devgame';


function FSGCopyText(props) {

    // const inputChange = (e) => {
    //     let name = e.target.name;
    //     let value = e.target.value;

    //     updateGameField(name, value);
    // }

    return (

        <Input
            name={props.name}
            id={props.id}
            ref={props.copyRef}
            value={props.value || ''}
            width={props.width}
            maxWidth={props.maxWidth}
            onFocus={props.onFocus}
            fontSize={props.fontSize || "12px"}
            fontWeight={props.fontWeight}
            height={props.height || '3rem'}
            readOnly
            size="xs"
            color={props.color || "gray.100"}
            bgColor={props.bgColor || "gray.800"}
            borderColor={props.borderColor || "gray.800"}
            outlineColor={props.outlineColor || 'gray.800'}
            _hover={{ borderColor: 'gray.800' }}
        />


    )

}

export default FSGCopyText;