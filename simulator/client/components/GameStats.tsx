import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    IconButton,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    Tbody,
    Td,
    Text,
    Thead,
    Tr,
    VStack,
} from "@chakra-ui/react";
import { SettingSelectInput, SettingSwitchInput, SettingTextInput } from "./Inputs.tsx";
import { MdEdit } from "react-icons/md";
import { bucket, useBucket, useBucketSelector } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import { useRef } from "react";
import { updateGameSettings } from "../actions/websocket";

const btShowCreateStat = bucket<any>(false);
const btEditStat = bucket<any>(null);
const btCreateStat = bucket<any>({});
const btDeleteCheck = bucket<any>(false);
const btStatError = bucket<string[]>([]);

export function GameStats() {
    const stats = useBucketSelector(btGameSettings, (b: any) => b.stats);
    return (
        <VStack w="100%">
            <AddStat />

            {stats && Object.keys(stats).length > 0 && (
                <Table mt="2rem" mb="4rem">
                    <Thead>
                        <Tr>
                            <Td fontWeight="600">Name</Td>
                            <Td fontWeight="600">Abbreviation</Td>
                            <Td fontWeight="600">Type</Td>
                            <Td fontWeight="600" w="2rem" p="0"></Td>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {Object.keys(stats).map((abbr: string, idx: number) => (
                            <Stat
                                key={"stat-" + abbr}
                                abbr={abbr}
                                stat={stats[abbr]}
                                idx={idx}
                            />
                        ))}
                    </Tbody>
                </Table>
            )}
        </VStack>
    );
}

function AddStat() {
    const showCreateStat = useBucket(btShowCreateStat);
    const stat = useBucket(btCreateStat);
    const gs = useBucket(btGameSettings);
    const deleteCheck = useBucket(btDeleteCheck);
    const statErrors = useBucket(btStatError);
    const cancelRef = useRef<any>();

    const onDelete = () => {
        const gameSettings = btGameSettings.get();
        const stat = btCreateStat.get();
        const abbr = btEditStat.get();

        if (abbr && gameSettings.stats) {
            delete gameSettings.stats[abbr];
        }

        if (gameSettings.statsEnum) {
            const name = stat.name;
            delete gameSettings.statsEnum[name];
            delete gameSettings.statsEnum[abbr];
        }

        updateGameSettings(gameSettings);

        btCreateStat.set({});
        btEditStat.set(null);
        btShowCreateStat.set(false);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const onCancel = () => {
        btEditStat.set(null);
        btShowCreateStat.set(false);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const onDone = () => {
        btEditStat.set(null);
        btShowCreateStat.set(false);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const validate = () => {
        const stat = btCreateStat.get();
        const stats = btGameSettings.get((g: any) => g.stats) || {};
        const editAbbr = btEditStat.get();
        const newErrors: string[] = [];

        const checkStats = editAbbr
            ? Object.fromEntries(
                  Object.entries(stats).filter(([key]) => key !== editAbbr)
              )
            : stats;

        if (!stat.name || stat.name.trim().length < 3) {
            newErrors.push("Must have a name with at least 3 characters");
        }
        if (!stat.abbr || stat.abbr.trim().length === 0) {
            newErrors.push("Must have an abbreviation");
        }
        if (checkStats && stat.abbr && checkStats[stat.abbr]) {
            newErrors.push("Abbreviation already exists.");
        }
        if (
            checkStats &&
            stat.name &&
            Object.values(checkStats).find((s: any) => s.name === stat.name)
        ) {
            newErrors.push("Name already exists.");
        }

        if (newErrors.length > 0) {
            btStatError.set(newErrors);
            return false;
        }
        return true;
    };

    const onCreateOrSave = () => {
        const gameSettings = btGameSettings.get();
        const stat = btCreateStat.get();
        const editAbbr = btEditStat.get();

        if (!validate()) return;

        if (!gameSettings.stats) gameSettings.stats = {};
        if (!gameSettings.statsEnum) gameSettings.statsEnum = {};

        if (editAbbr) {
            // remove old key if abbr changed
            if (editAbbr !== stat.abbr) {
                delete gameSettings.stats[editAbbr];
                delete gameSettings.statsEnum[editAbbr];
                // also remove old name key
                const oldStat = gameSettings.statsEnum;
                Object.keys(oldStat).forEach((k) => {
                    if (oldStat[k] === editAbbr) delete gameSettings.statsEnum[k];
                });
            }
        }

        gameSettings.stats[stat.abbr] = stat;
        gameSettings.statsEnum[stat.name] = stat.abbr;
        gameSettings.statsEnum[stat.abbr] = stat.abbr;

        updateGameSettings(gameSettings);

        btEditStat.set(null);
        btCreateStat.set({});
        btShowCreateStat.set(false);
        btStatError.set([]);
    };

    const isReadyForCreate = stat && stat?.name?.length > 0 && stat?.abbr?.length > 0;

    return (
        <>
            <Button
                p="1.5rem"
                px="2rem"
                borderRadius={"2rem"}
                fontSize="1.4rem"
                fontWeight="500"
                bgColor="brand.500"
                _hover={{ bgColor: "brand.400" }}
                onClick={() => {
                    btCreateStat.set({});
                    btEditStat.set(null);
                    btShowCreateStat.set("create");
                }}
            >
                Add +
            </Button>

            <Modal size="xl" isOpen={showCreateStat} onClose={onCancel}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" flexDir="row">
                        <Text fontWeight={"500"}>
                            {showCreateStat == "create" ? "Create" : "Edit"} Stat
                        </Text>
                        <Box flex="1"></Box>
                        {showCreateStat == "edit" && (
                            <>
                                <Button
                                    p="0rem"
                                    px="1rem"
                                    fontSize="1.4rem"
                                    fontWeight="500"
                                    bgColor="red.600"
                                    color="gray.0"
                                    onClick={() => btDeleteCheck.set(true)}
                                >
                                    Delete
                                </Button>
                                <AlertDialog
                                    isOpen={deleteCheck}
                                    leastDestructiveRef={cancelRef}
                                    onClose={onDone}
                                >
                                    <AlertDialogOverlay>
                                        <AlertDialogContent>
                                            <AlertDialogHeader
                                                fontSize="1.6rem"
                                                fontWeight="600"
                                                color="gray.0"
                                            >
                                                Delete Stat
                                            </AlertDialogHeader>
                                            <AlertDialogBody>
                                                Delete{" "}
                                                <Text
                                                    as="span"
                                                    color="brand.900"
                                                    fontWeight="600"
                                                >
                                                    {stat?.name}
                                                </Text>
                                                ? You can't undo this action afterwards.
                                            </AlertDialogBody>
                                            <AlertDialogFooter>
                                                <Button
                                                    fontWeight="500"
                                                    fontSize="1.4rem"
                                                    ref={cancelRef}
                                                    color="gray.0"
                                                    variant={"secondary"}
                                                    onClick={onDone}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    fontWeight="500"
                                                    color="gray.0"
                                                    fontSize="1.4rem"
                                                    bgColor="red.600"
                                                    onClick={onDelete}
                                                    ml={3}
                                                >
                                                    Delete
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialogOverlay>
                                </AlertDialog>
                            </>
                        )}
                    </ModalHeader>
                    <ModalBody>
                        <CreateStat />
                        <VStack pt="2rem">
                            {statErrors && statErrors.map((error: string) => (
                                <Text as="span" color="red.300" key={error}>
                                    {error}
                                </Text>
                            ))}
                        </VStack>
                    </ModalBody>

                    <ModalFooter
                        pb="0"
                        px="0"
                        pt="2rem"
                        display="flex"
                        flexDir={"row"}
                        alignItems={"stretch"}
                    >
                        <Button
                            bgColor="gray.200"
                            borderRadius={0}
                            p="2rem"
                            fontSize="1.4rem"
                            fontWeight="500"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Box flex="1"></Box>
                        <Button
                            bgColor="brand.500"
                            fontSize="1.4rem"
                            fontWeight="500"
                            borderRadius={0}
                            isDisabled={showCreateStat == "create" && !isReadyForCreate}
                            p="2rem"
                            variant={showCreateStat == "create" ? "primary" : "secondary"}
                            onClick={onCreateOrSave}
                        >
                            {showCreateStat == "create" ? "Create" : "Save"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

function CreateStat() {
    let stat = useBucket(btCreateStat);

    const useStatTarget = (_gameSettings: any, id: string, value: any) => {
        stat = btCreateStat.get();
        stat[id] = value;
        btCreateStat.set(stat);
        return false;
    };
    const useStatValue = (_gameSettings: any, id: string) => {
        stat = btCreateStat.get();
        return stat[id];
    };

    const valueTypeOptions = [
        { text: "Integer", value: 0 },
        { text: "Float", value: 1 },
        { text: "Average", value: 2 },
        { text: "Time", value: 3 },
    ];

    return (
        <VStack>
            <SettingTextInput
                id="name"
                title="Name"
                textWidth="13rem"
                maxLength={32}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingTextInput
                id="abbr"
                title="Abbreviation"
                textWidth="13rem"
                helperText="short key for game data"
                maxLength={8}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingSelectInput
                id="valueTYPE"
                title="Value Type"
                textWidth="13rem"
                options={valueTypeOptions}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingSwitchInput
                id="showInScoreboard"
                title="Show In Scoreboard"
                textWidth="13rem"
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
        </VStack>
    );
}

function Stat({ abbr, stat, idx }: { abbr: string; stat: any; idx: number }) {
    const isEven = idx % 2 == 0;

    const valueTypeLabel = (t: number) => {
        switch (t) {
            case 0:
                return "Integer";
            case 1:
                return "Float";
            case 2:
                return "Average";
            case 3:
                return "Time";
            default:
                return "Integer";
        }
    };

    return (
        <Tr>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Text as="span" fontWeight="500">
                    {stat.name}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Text
                    as="span"
                    fontWeight="500"
                    borderRadius={"12px"}
                    bgColor={isEven ? "gray.500" : "gray.500"}
                    p="0.5rem"
                    px="1rem"
                >
                    {abbr}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Text as="span" fontWeight="500">
                    {valueTypeLabel(stat.valueTYPE)}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"} w="2rem" p="0">
                <IconButton
                    aria-label="Edit stat"
                    bgColor={"transparent"}
                    icon={<MdEdit />}
                    onClick={() => {
                        btCreateStat.set(structuredClone({ ...stat, abbr }));
                        btEditStat.set(abbr);
                        btShowCreateStat.set("edit");
                    }}
                ></IconButton>
            </Td>
        </Tr>
    );
}
