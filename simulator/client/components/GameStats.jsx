import { Card, CardBody, CardHeader, VStack } from "@chakra-ui/react";

export function GameStats({}) {
    return (
        <VStack>
            <CreateStat />
        </VStack>
    );
}

function CreateStat({}) {
    return (
        <Card>
            <CardHeader>
                <Text fontWeight={"500"}>Create Stat</Text>
            </CardHeader>
            <CardBody></CardBody>
        </Card>
    );
}
