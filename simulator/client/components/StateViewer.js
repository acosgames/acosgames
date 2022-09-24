import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, HStack, Text, VStack } from '@chakra-ui/react';
import fs from 'flatstore';
import ReactJson from 'react-json-view'
import { ReplayControls } from './ActionPanel';

export function StateViewer(props) {
    let [gameState] = fs.useWatch('gameState');

    if (!gameState)
        return <></>

    return (
        <Box>
            {/* <ReactJson
                src={gameState}
                theme="isotope"
                enableClipboard="false"
                displayDataTypes="false"
                displayObjectSize="false"
            /> */}
            <ReplayControls />
            <Accordion allowMultiple={true} allowToggle={true} pt="2rem" defaultIndex={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                <ObjectViewer object={gameState?.action} title="action" bgColor="gray.500" />
                <ObjectViewer object={gameState?.state} title="state" />
                <ObjectViewer object={gameState?.players} title="players" />
                {(gameState?.teams &&
                    <ObjectViewer object={gameState?.teams} title="teams" />
                )}

                <ObjectViewer object={gameState?.events} title="events" />
                <ObjectViewer object={gameState?.timer} title="timer" />
                <ObjectViewer object={gameState?.next} title="next" />
                <ObjectViewer object={gameState?.room} title="room" />
            </Accordion>
        </Box>
    )
}

function ObjectViewer(props) {

    let object = props.object;
    let title = props.title;

    return (
        <AccordionItem defaultValue={true} bgColor={props.bgColor || "gray.900"}>
            <AccordionButton height="4rem" lineHeight={'4rem'} px="1rem">
                <Box flex='1' textAlign='left'>
                    <Text w="100%"  >{title}</Text>
                </Box>
                <AccordionIcon />
            </AccordionButton>

            <AccordionPanel bgColor={"rgb(21, 21, 21)"}>
                <VStack w="100%" alignItems={'flex-start'}>
                    <HStack w="100%" >

                    </HStack>
                    <Box px="1rem">
                        <ReactJson
                            src={object || {}}
                            theme="chalk"
                            name={false}
                            enableClipboard={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                        />
                    </Box>

                </VStack>
            </AccordionPanel>
        </AccordionItem>
    )

}