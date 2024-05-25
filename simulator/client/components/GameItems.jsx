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
import { bucket, useBucket, useBucketSelector } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import { useRef } from "react";
import { updateGameSettings } from "../actions/websocket";

let btShowCreateItem = bucket(false);
let btEditItem = bucket(null);
let btCreateItem = bucket({});
let btDeleteCheck = bucket(false);
let btItemError = bucket([]);

export function GameItems({}) {
    let showCreateItem = useBucket(btShowCreateItem);
    let item = useBucket(btCreateItem);
    let items = useBucketSelector(btGameSettings, (b) => b.items);
    return (
        <VStack w="100%">
            <AddGameItem />

            {items?.length > 0 && (
                <Table mt="2rem" mb="4rem">
                    <Thead>
                        <Tr>
                            <Td fontWeight="600">Name</Td>
                            <Td fontWeight="600">Max Uses</Td>
                            <Td fontWeight="600">Expire days</Td>
                            <Td fontWeight="600" w="2rem" p="0"></Td>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {items.map((item) => (
                            <GameItem
                                key={"item-" + item.item_name + item.item_slug}
                                item={item}
                            />
                        ))}
                    </Tbody>
                </Table>
            )}
        </VStack>
    );
}

function AddGameItem({}) {
    let showCreateItem = useBucket(btShowCreateItem);
    let item = useBucket(btCreateItem);
    let gs = useBucket(btGameSettings);
    let deleteCheck = useBucket(btDeleteCheck);
    let itemErrors = useBucket(btItemError);
    const cancelRef = useRef();

    const onDelete = () => {
        let gameSettings = btGameSettings.get();
        let item = btCreateItem.get();

        gameSettings.items.sort((a, b) => a.item_order - b.item_order);
        let index = gameSettings?.items
            ?.map((s) => s.item_name)
            .indexOf(item.item_name);
        gameSettings.items.splice(index, 1);
        gameSettings.items.forEach((s, i) => {
            s.item_order = i;
        });

        updateGameSettings(gameSettings);

        btCreateItem.set({});
        btShowCreateItem.set(false);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const onCancel = (e) => {
        btEditItem.set(null);
        btShowCreateItem.set(null);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const onDone = (e) => {
        btEditItem.set(null);
        btShowCreateItem.set(null);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const validate = () => {
        let item = btCreateItem.get();
        let items = btGameSettings.get((g) => g.items);
        let newErrors = [];

        let checkItems = [];
        if (showCreateItem == "edit") {
            checkItems = items.filter((s) => s.item_order != item.item_order);
        } else {
            checkItems = items.filter((s) => true);
        }
        if (item.item_name == "" || item?.item_name?.trim().length < 3) {
            newErrors.push("Must have a name with at least 3 characters");
        }

        if (item.item_slug == "" || item?.item_slug?.trim().length == 0) {
            newErrors.push("Must have a slug with at least 1 character");
        }
        if (checkItems && checkItems.length > 0) {
            if (checkItems.find((s) => s.item_name == item.name)) {
                newErrors.push("Name already exist.");
            }

            if (checkItems.find((s) => s.item_slug == item.item_slug)) {
                newErrors.push("Slug already exist.");
            }
        }

        if (newErrors.length > 0) {
            btItemError.set(newErrors);
            return false;
        }

        return true;
    };

    const onCreateOrSave = (e) => {
        let gameSettings = btGameSettings.get();
        let item = btCreateItem.get();
        if (!gameSettings.items) gameSettings.items = [];

        if (!validate()) {
            return;
        }

        if (typeof item?.item_order === "undefined") {
            item.item_order = gameSettings.items.length;
            gameSettings.items.push(item);
        } else {
            let id = gameSettings?.items
                ?.map((s) => s.item_order)
                .indexOf(item.item_order);
            gameSettings.items[id] = item;
        }

        updateGameSettings(gameSettings);

        btEditItem.set(null);
        btShowCreateItem.set(false);
        btItemError.set([]);
    };

    let isReadyForCreate =
        item && item?.item_name?.length > 0 && item?.item_slug?.length > 0;

    return (
        <>
            <Button
                p="1.5rem"
                px="2rem"
                borderRadius={"2rem"}
                bgColor="brand.500"
                _hover={{
                    bgColor: "brand.400",
                }}
                onClick={() => {
                    btCreateItem.set({});
                    btShowCreateItem.set("create");
                }}
            >
                Add +
            </Button>

            <Modal size="xl" isOpen={showCreateItem} onClose={onCancel}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" flexDir="row">
                        <Text fontWeight={"500"}>
                            {showCreateItem == "create" ? "Create" : "Edit"}{" "}
                            Item
                        </Text>
                        <Box flex="1"></Box>
                        {showCreateItem == "edit" && (
                            <>
                                <Button
                                    p="0rem"
                                    px="1rem"
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
                                                fontSize="lg"
                                                fontWeight="bold"
                                            >
                                                Delete Item
                                            </AlertDialogHeader>

                                            <AlertDialogBody>
                                                Delete{" "}
                                                <Text
                                                    as="span"
                                                    color="brand.900"
                                                    fontWeight="600"
                                                >
                                                    {item?.item_name}
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
                        {showCreateItem == "create" && (
                            <CreateItem isCreate={true} />
                        )}
                        {showCreateItem == "edit" && (
                            <CreateItem
                                isCreate={false}
                                index={item?.item_order || 0}
                            />
                        )}

                        <VStack pt="2rem">
                            {itemErrors.map((error) => {
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
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Box flex="1"></Box>
                        <Button
                            bgColor="blue.500"
                            borderRadius={0}
                            isDisabled={
                                showCreateItem == "create" && !isReadyForCreate
                            }
                            p="2rem"
                            variant={
                                showCreateItem == "create"
                                    ? "primary"
                                    : "secondary"
                            }
                            onClick={onCreateOrSave}
                        >
                            {showCreateItem == "create" ? "Create" : "Save"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
function CreateItem({ isCreate, index }) {
    let item = useBucket(btCreateItem);

    const useItemTarget = (gameSettings, id, value) => {
        item = btCreateItem.get();
        item[id] = value;
        btCreateItem.set(item);
        return false;
    };
    const useItemValue = (gameSettings, id) => {
        item = btCreateItem.get();
        return item[id];
    };

    return (
        <VStack>
            <SettingTextInput
                id="item_name"
                title="Name"
                textWidth="13rem"
                maxLength={"32"}
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
            <SettingTextInput
                id="item_desc"
                title="Description"
                textWidth="13rem"
                maxLength={255}
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
            <SettingTextInput
                id="item_slug"
                title="Slug"
                textWidth="13rem"
                helperText="used in player object"
                maxLength={32}
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
            <SettingNumberInput
                id="max_uses"
                title="Max Uses"
                placeholder="0"
                textWidth={"13rem"}
                helperText="0 = unlimited"
                theme="row"
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
            <SettingNumberInput
                id="expire_days"
                title="Expires in"
                placeholder="0"
                textWidth={"13rem"}
                theme="row"
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
        </VStack>
    );
}

function GameItem({ item }) {
    let item_order = item?.item_order || 0;
    let isEven = item_order % 2 == 0;

    return (
        <Tr>
            <Td bgColor={isEven ? "gray.700" : "gray.750"}>
                <Tooltip label={item.item_desc} placement="top">
                    <Text
                        as="span"
                        fontWeight="500"
                        borderRadius={"12px"}
                        bgColor={isEven ? "gray.500" : "gray.500"}
                        p="0.5rem"
                        px="1rem"
                    >
                        {item.item_name}
                    </Text>
                </Tooltip>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"} w="4rem">
                <Text as="span" fontWeight="500">
                    {item.max_uses}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"} w="4rem">
                <Text as="span" fontWeight="500">
                    {item.expire_days}
                </Text>
            </Td>
            <Td bgColor={isEven ? "gray.700" : "gray.750"} w="2rem" p="0">
                <IconButton
                    bgColor={"transparent"}
                    icon={<MdEdit />}
                    onClick={() => {
                        btCreateItem.set(structuredClone(item));
                        btShowCreateItem.set("edit");
                    }}
                ></IconButton>
            </Td>
        </Tr>
    );
}
