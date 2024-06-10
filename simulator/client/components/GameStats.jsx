import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    HStack,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Switch,
    Table,
    Tbody,
    Td,
    Text,
    Thead,
    Tooltip,
    Tr,
    VStack,
} from "@chakra-ui/react";
import {
    SettingNumberInput,
    SettingSelectInput,
    SettingSwitchInput,
    SettingTextInput,
} from "./Inputs";

import { MdEdit } from "react-icons/md";

import { useRef, useState } from "react";
import { bucket, useBucket, useBucketSelector } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import { updateGameSettings } from "../actions/websocket";

let btShowCreateStat = bucket(false);
let btEditStat = bucket(null);
let btCreateStat = bucket({});
let btDeleteCheck = bucket(false);
let btStatError = bucket([]);

export function GameStats({}) {
    let showCreateStat = useBucket(btShowCreateStat);
    let stat = useBucket(btCreateStat);
    let stats = useBucketSelector(btGameSettings, (b) => b.stats);
    return (
        <VStack w="100%">
            <AddStat />

            {stats?.length > 0 && (
                <Table mt="2rem" mb="4rem">
                    <Thead>
                        <Tr>
                            <Td fontWeight="600">Abbr</Td>
                            <Td fontWeight="600">Type</Td>
                            <Td fontWeight="600">Score</Td>
                            <Td fontWeight="600" w="2rem" p="0"></Td>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {stats.map((stat) => (
                            <Stat
                                key={
                                    "stat-" +
                                    stat.stat_name +
                                    stat.stat_abbreviation
                                }
                                stat={stat}
                            />
                        ))}
                    </Tbody>
                </Table>
            )}
        </VStack>
    );
}

function AddStat({}) {
    let showCreateStat = useBucket(btShowCreateStat);
    let stat = useBucket(btCreateStat);
    let gs = useBucket(btGameSettings);
    let deleteCheck = useBucket(btDeleteCheck);
    let statErrors = useBucket(btStatError);
    const cancelRef = useRef();

    const onDelete = () => {
        let gameSettings = btGameSettings.get();
        let stat = btCreateStat.get();

        gameSettings.stats.sort((a, b) => a.stat_order - b.stat_order);
        let index = gameSettings?.stats
            ?.map((s) => s.stat_name)
            .indexOf(stat.stat_name);
        gameSettings.stats.splice(index, 1);
        gameSettings.stats.forEach((s, i) => {
            s.stat_order = i;
        });

        updateGameSettings(gameSettings);

        btCreateStat.set({});
        btShowCreateStat.set(false);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const onCancel = (e) => {
        btEditStat.set(null);
        btShowCreateStat.set(null);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const onDone = (e) => {
        btEditStat.set(null);
        btShowCreateStat.set(null);
        btDeleteCheck.set(false);
        btStatError.set([]);
    };

    const validate = () => {
        let stat = btCreateStat.get();
        let stats = btGameSettings.get((g) => g.stats);
        let newErrors = [];

        let checkStats = [];
        if (showCreateStat == "edit") {
            checkStats = stats.filter((s) => s.stat_order != stat.stat_order);
        } else {
            checkStats = stats.filter((s) => true);
        }
        if (stat.stat_name == "" || stat?.stat_name?.trim().length < 3) {
            newErrors.push("Must have a name with at least 3 characters");
        }

        if (
            stat.stat_abbreviation == "" ||
            stat?.stat_abbreviation?.trim().length == 0
        ) {
            newErrors.push(
                "Must have a abbreviation with at least 1 character"
            );
        }
        if (checkStats && checkStats.length > 0) {
            if (checkStats.find((s) => s.stat_name == stat.name)) {
                newErrors.push("Name already exist.");
            }

            if (
                checkStats.find(
                    (s) => s.stat_abbreviation == stat.stat_abbreviation
                )
            ) {
                newErrors.push("Abbreviation already exist.");
            }

            // if (stats.find((s) => s.stat_order == stat.stat_order)) {
            //     newErrors.push("stat_order already exist.");
            // }
        }

        if (newErrors.length > 0) {
            btStatError.set(newErrors);
            return false;
        }

        return true;
    };

    const onCreateOrSave = (e) => {
        let gameSettings = btGameSettings.get();
        let stat = btCreateStat.get();
        if (!gameSettings.stats) gameSettings.stats = [];

        if (typeof stat.valueTYPE === "undefined") {
            stat.valueTYPE = 0;
        }

        if (!validate()) {
            return;
        }

        if (typeof stat?.stat_order === "undefined") {
            stat.stat_order = gameSettings.stats.length;
            gameSettings.stats.push(stat);
        } else {
            let id = gameSettings?.stats
                ?.map((s) => s.stat_order)
                .indexOf(stat.stat_order);
            gameSettings.stats[id] = stat;
        }

        updateGameSettings(gameSettings);

        btEditStat.set(null);
        btShowCreateStat.set(false);
        btStatError.set([]);
    };

    let isReadyForCreate =
        stat &&
        stat?.stat_name?.length > 0 &&
        // stat?.stat_desc?.length > 0 &&
        stat?.stat_abbreviation?.length > 0;

    return (
        <>
            <Button
                p="1.5rem"
                px="2rem"
                borderRadius={"2rem"}
                bgColor="brand.500"
                fontSize="1.4rem"
                fontWeight="500"
                _hover={{
                    bgColor: "brand.400",
                }}
                onClick={() => {
                    btCreateStat.set({});
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
                            {showCreateStat == "create" ? "Create" : "Edit"}{" "}
                            Stat
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
                                                    {stat?.stat_name}
                                                </Text>
                                                ? You can't undo this action
                                                afterwards.
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
                    {/* <ModalHeader>Modal Title</ModalHeader> */}
                    {/* <ModalCloseButton /> */}
                    <ModalBody>
                        {showCreateStat == "create" && (
                            <CreateStat isCreate={true} />
                        )}
                        {showCreateStat == "edit" && (
                            <CreateStat
                                isCreate={false}
                                index={stat?.stat_order || 0}
                            />
                        )}

                        <VStack pt="2rem">
                            {statErrors.map((error) => {
                                return (
                                    <Text as="span" color="red.300">
                                        {error}
                                    </Text>
                                );
                            })}
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
                            isDisabled={
                                showCreateStat == "create" && !isReadyForCreate
                            }
                            p="2rem"
                            variant={
                                showCreateStat == "create"
                                    ? "primary"
                                    : "secondary"
                            }
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
function CreateStat({ isCreate, index }) {
    let stat = useBucket(btCreateStat);

    const useStatTarget = (gameSettings, id, value) => {
        stat = btCreateStat.get();
        stat[id] = value;
        btCreateStat.set(stat);
        return false;
    };
    const useStatValue = (gameSettings, id) => {
        stat = btCreateStat.get();
        return stat[id];
    };

    return (
        <VStack>
            <SettingTextInput
                id="stat_slug"
                title="Slug"
                textWidth="13rem"
                maxLength={"32"}
                uppercase={true}
                disabled={!isCreate}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingTextInput
                id="stat_name"
                title="Name"
                textWidth="13rem"
                maxLength={"32"}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingTextInput
                id="stat_desc"
                title="Description"
                textWidth="13rem"
                maxLength={255}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingTextInput
                id="stat_abbreviation"
                title="Abbreviation"
                textWidth="13rem"
                helperText="1-3 character short name"
                maxLength={3}
                uppercase={true}
                regex={/[^A-Z0-9]/g}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
            <SettingSelectInput
                id="valueTYPE"
                title="Value Type"
                textWidth="13rem"
                options={[
                    { text: "Integer", value: 0 },
                    { text: "Float", value: 1 },
                    { text: "Average", value: 2 },
                    { text: "Time", value: 3 },
                    { text: "String Counts", value: 4 },
                ]}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />

            <SettingSwitchInput
                id="scoreboard"
                title="Scoreboard?"
                textWidth="24rem"
                helperText={"Max of 4 stats on scoreboard"}
                useTarget={useStatTarget}
                useValue={useStatValue}
            />
        </VStack>
    );
}

function Stat({ stat }) {
    let stat_order = stat?.stat_order || 0;
    let isEven = stat_order % 2 == 0;

    let typeName = "";
    switch (stat.valueTYPE) {
        case 0:
            typeName = "Integer";
            break;
        case 1:
            typeName = "Float";
            break;
        case 2:
            typeName = "Average";
            break;
        case 3:
            typeName = "Time";
            break;
        case 4:
            typeName = "String Counts";
            break;
        default:
            typeName = "Integer";
            break;
    }
    return (
        <Tr>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Tooltip
                    label={stat.stat_name + " - " + stat.stat_desc}
                    placement="top"
                >
                    <Text
                        as="span"
                        fontWeight="500"
                        borderRadius={"12px"}
                        bgColor={isEven ? "gray.500" : "gray.500"}
                        p="0.5rem"
                        px="1rem"
                    >
                        {stat.stat_abbreviation}
                    </Text>
                </Tooltip>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Text as="span" fontWeight="500">
                    {typeName}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Text as="span" fontWeight="500">
                    {stat.scoreboard ? "yes" : "no"}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"} w="2rem" p="0">
                <IconButton
                    bgColor={"transparent"}
                    icon={<MdEdit />}
                    onClick={() => {
                        btCreateStat.set(structuredClone(stat));
                        btShowCreateStat.set("edit");
                        // btEditStat.set(true);
                    }}
                ></IconButton>
            </Td>
        </Tr>
    );
}
