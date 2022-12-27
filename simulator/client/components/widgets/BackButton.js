
import { VStack, Image, Text, Heading, Center, Box, Flex, IconButton } from "@chakra-ui/react";
import { FaArrowLeft } from '@react-icons'

export default function BackButton(props) {

    const handleGoBack = () => {
        props.history.push("/games");
    }

    return (
        <Box width="100%" justifyItems={'flex-start'}>
            <IconButton icon={<FaArrowLeft />} onClick={handleGoBack}></IconButton>
        </Box>
    )

}