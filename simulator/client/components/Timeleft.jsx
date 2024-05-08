import { Box, Heading, HStack, Text, Tooltip } from "@chakra-ui/react";
import fs from "flatstore";
// import { getGamePanel, getPrimaryGamePanel, getRoomStatus, isUserNext } from '../../actions/room';

function Timeleft(props) {
    // let [primaryGamePanelId] = fs.useWatch('primaryGamePanel');

    // if (typeof primaryGamePanelId === 'undefined' || primaryGamePanelId == null)
    //     return <></>

    return <TimeleftDisplay />;
}
function TimeleftDisplay(props) {
    let [timeleftUpdated] = fs.useWatch("timeleftUpdated");
    let timeleft = fs.get("timeleft") || 0;

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

    // let isNext = isUserNext(gamepanel);

    // let roomStatus = 'NONE';
    // if (gamepanel?.room?.room_slug)
    //     roomStatus = getRoomStatus(gamepanel.room.room_slug);

    // let nextColor = 'yellow.500'
    // let nextText = 'WAIT';
    // if (roomStatus == 'GAME' && isNext) {
    //     nextText = 'GO';
    //     nextColor = 'brand.900'
    // } else if (roomStatus != 'GAME' && roomStatus != 'LOADING') {
    //     nextText = 'GG';
    //     nextColor = 'gray.200'
    // }

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
                cursor="pointer"
                //bgColor={isNext ? 'gray.700' : ""}
                borderRadius="1rem"
                bgColor="gray.900"
                border="1px solid"
                borderColor={"gray.400"} //"gray.175"
                width="12rem"
                spacing="0"
                fontSize="xl"
                fontWeight="light"
                color="gray.10"
                position="relative"
                // pl="1rem"
                // _after={{
                //     content: "''",
                //     width: "100%",
                //     height: "100%",
                //     transform: "skew(-20deg)",
                //     position: "absolute",
                //     borderLeft: "6px solid",
                //     borderLeftColor: "gray.50",
                //     borderRight: "6px solid",
                //     borderRightColor: "gray.50",
                //     top: 0,
                //     left: 0,
                //     bgColor: "gray.900",
                //     zIndex: -1,
                // }}
            >
                <HStack spacing="0" display={hour > 0 ? "flex" : "none"}>
                    <Heading fontSize="2rem" as="span" className="digitaltimer">
                        {hour < 10 ? "0" + hour : hour}
                    </Heading>
                </HStack>
                <Heading
                    display={hour > 0 ? "inline-block" : "none"}
                    as="span"
                    px="0.25rem"
                    fontSize="2rem"
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
                        textAlign={"center"}
                    >
                        {min < 10 ? "0" + min : min}
                    </Heading>
                </HStack>
                <Heading as="span" px="0.25rem" color="white" fontSize="2rem">
                    :
                </Heading>
                <HStack spacing="0" w="2.25rem">
                    <Heading
                        as="span"
                        className="digitaltimer"
                        fontSize="2rem"
                        textAlign={"center"}
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
                >
                    .
                </Heading>
                <HStack
                    spacing="0"
                    // visibility={greaterThan10 ? "hidden" : "visible"}
                    alignItems={"flex-end"}
                    justifyContent={"flex-end"}
                    w="1.5rem"
                    height="4.5rem"
                >
                    <Heading
                        as="span"
                        fontSize="1.4rem"
                        lineHeight={"4rem"}
                        textAlign={"center"}
                        // color={greaterThan10 ? "white" : "red.500"}
                        // animation={greaterThan10 ? '' : 'timerblink 1s infinite'}
                        // className="digitaltimer"
                        // fontVariantNumeric="tabular-nums"
                    >
                        {ms}
                    </Heading>
                </HStack>
            </HStack>
        </HStack>
    );
}

export default Timeleft;
