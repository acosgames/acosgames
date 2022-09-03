import { Box, useToast, VStack, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import fs from 'flatstore';
// import config from '../../../config'

function LoadingBox(props) {

    const toast = useToast();
    const [show, setShow] = useState(true);

    useEffect(() => {

        if (props.isDoneLoading) {
            toast.closeAll()
            setTimeout(() => {
                setShow(false);

            }, 400)
        }
    })

    if (!show)
        return <></>

    return (
        <Box
            className="loading-screen"
            position={'absolute'}
            left="0"
            top="0"
            w="100%"
            h="100%"
            zIndex={100}
            bgColor={'blacks.100'}
            transition={'filter 0.4s ease-in'}
            filter={props.isDoneLoading ? 'opacity(0)' : 'opacity(1)'}
        >
            <VStack w="100%" h="100%" justifyItems={'center'} justifyContent="center" alignContent="center" alignItems={'center'}>
                {/* <Text>Loading...</Text> */}
                <Image
                    alt={'A cup of skill logo'}
                    src={`https://cdn.acos.games/file/acospub/acos-logo-combined.png`}
                    w="300px" h="124.5px"
                />
                <div className="ldr-1"><div className="ball1"></div><div className="ball2"></div><div className="ball3"></div><div className="ball4"></div></div>
                {/* <br /><br />
                <Box className="factory-7"></Box> */}
            </VStack>
        </Box>
    )
}

export default fs.connect([])(LoadingBox);