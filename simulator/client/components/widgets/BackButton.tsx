import { Box, IconButton } from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";

interface BackButtonProps {
    history: { push: (path: string) => void };
}

export default function BackButton(props: BackButtonProps) {
    const handleGoBack = () => {
        props.history.push("/games");
    };

    return (
        <Box width="100%" justifyItems={"flex-start"}>
            <IconButton aria-label="Go back" icon={<FaArrowLeft />} onClick={handleGoBack} />
        </Box>
    );
}
