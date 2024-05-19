import { Box, Heading, HStack, Text, Tooltip } from "@chakra-ui/react";
import { useBucket } from "react-bucketjs";
import { btTimeleft, btTimeleftUpdated } from "../actions/buckets";

function Timeleft(props) {
    let timeleftUpdated = useBucket(btTimeleftUpdated);
    let timeleft = btTimeleft.get() || 0;

    // let [timeleft] = fs.useWatch('timeleft/' + props.id) || 0;
    // let [gamepanel] = fs.useWatch('gamepanel/' + props.id);

    // let gamepanel = getGamePanel(props.id);
    // if (!gamepanel)
    //     return <></>

    try {
        timeleft = Number.parseInt(timeleft) / 1000;

        // if (timeleft > 10)
        //     timeleft = Math.floor(timeleft);
    } catch (e) {
        timeleft = 0;
    }

    // timeleft = 10000;

    if (Number.isNaN(timeleft)) timeleft = 0;

    let hour = Math.floor((timeleft % 86400) / 3600);
    let min = Math.floor((timeleft % 3600) / 60);
    let sec = Math.floor(timeleft) % 60;
    let ms = 100 * (timeleft - Math.floor(timeleft));
    if (ms < 10) {
        ms = "0" + ms;
    } else {
        ms = "" + ms;
    }
    ms = ms.substring(0, 2);

    let greaterThan10 = timeleft >= 10;
    let isEven = timeleft % 2 == 0;

    let textColor = "gray.20";

    return (
        <HStack
            // width="100%"
            ml="1rem"
            align="center"
            alignContent="center"
            justifyContent={"center"}
            alignItems="center"
            className="timeleft-wrapper"
        >
            <HStack
                className="timeleft-wrapper"
                // width="100%"
                height={"3rem"}
                alignContent="center"
                justifyContent={"center"}
                alignItems="center"
                px="0rem"
                py="1.5rem"
                // mr="4rem"
                // cursor="pointer"
                //bgColor={isNext ? 'gray.700' : ""}
                borderRadius="1rem"
                bgColor="gray.900"
                border="1px solid"
                borderColor={"gray.400"} //"gray.175"
                width="12rem"
                spacing="0"
                fontSize="xl"
                fontWeight="light"
                color={textColor}
                position="relative"
            >
                <HStack spacing="0" display={hour > 0 ? "flex" : "none"}>
                    <Heading
                        fontSize="2rem"
                        as="span"
                        className="digitaltimer"
                        color={textColor}
                    >
                        {hour < 10 ? "0" + hour : hour}
                    </Heading>
                </HStack>
                <Heading
                    display={hour > 0 ? "inline-block" : "none"}
                    as="span"
                    px="0.25rem"
                    fontSize="2rem"
                    color={textColor}
                >
                    :
                </Heading>
                <HStack
                    spacing="0"
                    visibility={min >= 0 ? "visible" : "hidden"}
                    w="2.25rem"
                >
                    <Heading
                        as="span"
                        className="digitaltimer"
                        fontSize="2rem"
                        fontWeight="light"
                        textAlign={"center"}
                        color={textColor}
                    >
                        {min < 10 ? "0" + min : min}
                    </Heading>
                </HStack>
                <Heading
                    as="span"
                    px="0.25rem"
                    fontSize="2rem"
                    color={textColor}
                >
                    :
                </Heading>
                <HStack spacing="0" w="2.25rem">
                    <Heading
                        as="span"
                        className="digitaltimer"
                        fontSize="2rem"
                        fontWeight="light"
                        textAlign={"center"}
                        color={textColor}
                    >
                        {min >= 0 && sec < 10 ? "0" + sec : sec}
                    </Heading>
                </HStack>
                <Heading
                    w="1rem"
                    as="span"
                    px="0.1rem"
                    pt="0.25rem"
                    fontSize="2rem"
                    textAlign={"center"}
                    color={textColor}
                >
                    .
                </Heading>
                <HStack
                    spacing="0"
                    alignItems={"flex-end"}
                    justifyContent={"flex-end"}
                    w="1.5rem"
                    height="4.5rem"
                >
                    <Heading
                        as="span"
                        fontSize="1.4rem"
                        fontWeight="light"
                        lineHeight={"4rem"}
                        textAlign={"center"}
                        color={textColor}
                    >
                        {ms}
                    </Heading>
                </HStack>
            </HStack>
        </HStack>
    );
}

export default Timeleft;
