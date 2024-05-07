
import { FormControl, FormLabel, FormHelperText } from "@chakra-ui/form-control";
import { useColorModeValue, VStack, Heading, StackDivider } from "@chakra-ui/react";

function FSGGroup(props) {

    const borderColor = useColorModeValue('red.500', 'red.200')

    return (
        <VStack align='stretch' width={props.width || "100%"}>
            <Heading
                as={props.as || 'h2'}
                // ml="0rem"
                // pl="0.4rem"
                // pr="0.4rem"
                display={props.title ? 'block' : 'none'}
                pt={props.hpt || "4"}
                pb={props.hpb || "0.5rem"}
                fontSize={props.hfontSize || "2xl"}
                fontWeight={props.hfontWeight || "800"}
                color={props.hcolor || "gray.100"}>
                {props.title}
            </Heading>
            <VStack
                // as='fieldset'
                pl={props.pl || ['1rem', '2rem', "3rem"]}
                pr={props.pr || ['1rem', '2rem', "3rem"]}
                pt={props.pt || "1rem"}
                pb={props.pb || "1rem"}
                // divider={<StackDivider borderColor='gray.700' ml="-3rem" mr="-3rem" mt="2rem" mb="`2rem" />}
                // border={`1px solid #000`}
                // borderColor="#171c26"
                spacing={props.spacing || "2rem"}
                bgColor={props.bgColor || "blacks.150"}
                color={props.color || "gray.100"}
                borderRadius={props.borderRadius || "14px"}>

                {props.children}
                {
                    props.helpText &&
                    <FormHelperText>
                        {props.helpText}
                    </FormHelperText>
                }



            </VStack >
        </VStack>
    )

}

export default FSGGroup;