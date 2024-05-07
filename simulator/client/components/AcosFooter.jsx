import {
    Box,
    Divider,
    HStack,
    SimpleGrid,
    Text,
    VStack,
    Link as ChLink,
    Icon,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

import { FaGithub, FaTwitter, FaDiscord } from "react-icons/fa";

import fs from "flatstore";

function AcosFooter(props) {
    let queues = props.queues;
    let inQueues = queues && queues.length > 0;
    // if (!queues || queues.length == 0) {
    //     return (<React.Fragment></React.Fragment>)
    // }

    return (
        <VStack py={"4rem"} w="100%" justifyContent={"center"}>
            {/* <Divider mt={[3, 3, 10]} mb={[3, 3, 8]} />
            <HStack spacing="2rem" display={['none', 'none', 'flex']}>
                <Text as="span" fontWeight="100" fontSize="xxs">Copyright © 2022 ACOS</Text>
                <Text fontSize="xxs"><Link to="/">Games</Link></Text>
                <Text fontSize="xxs"><Link to="/dev">Dev Zone</Link></Text>
                <Text fontSize="xxs"><ChLink isExternal href="https://sdk.acos.games">Docs</ChLink></Text>
                <Text fontSize="xxs"><Link to="/privacy">Privacy</Link></Text>
                <Text fontSize="xxs"><Link to="/terms">Terms</Link></Text>
                <Text fontSize="md"><ChLink isExternal href="https://github.com/acosgames"><Icon as={FaGithub} /></ChLink></Text>
                <Text fontSize="md"><ChLink isExternal href="https://twitter.com/acosgames"><Icon as={FaTwitter} /></ChLink></Text>
                <Text fontSize="md"><ChLink isExternal href='https://discord.gg/ydHkCcNgHD' ><Icon as={FaDiscord} /></ChLink></Text>
            </HStack> */}

            <VStack display={["flex", "flex"]}>
                <HStack spacing="1.4rem">
                    <Text fontSize="xxs">
                        <Link to="/">Games</Link>
                    </Text>
                    <Text fontSize="xxs">
                        <Link to="/dev">Dev Zone</Link>
                    </Text>
                    <Text fontSize="xxs">
                        <ChLink isExternal href="https://sdk.acos.games">
                            Docs
                        </ChLink>
                    </Text>
                    <Text fontSize="xxs">
                        <Link to="/privacy">Privacy</Link>
                    </Text>
                    <Text fontSize="xxs">
                        <Link to="/terms">Terms</Link>
                    </Text>
                    <Text fontSize="md">
                        <ChLink isExternal href="https://github.com/acosgames">
                            <Icon as={FaGithub} />
                        </ChLink>
                    </Text>
                    <Text fontSize="md">
                        <ChLink isExternal href="https://twitter.com/acosgames">
                            <Icon as={FaTwitter} />
                        </ChLink>
                    </Text>
                    <Text fontSize="md">
                        <ChLink isExternal href="https://discord.gg/ydHkCcNgHD">
                            <Icon as={FaDiscord} />
                        </ChLink>
                    </Text>
                </HStack>
                <Text as="span" fontWeight="100" fontSize="xxs">
                    Copyright © 2022 ACOS
                </Text>
            </VStack>
        </VStack>
    );
}

export default fs.connect(["queues"])(AcosFooter);
