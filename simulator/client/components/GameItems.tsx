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
    SettingCreatableInput,
    SettingNumberInput,
    SettingSelectInput,
    SettingSwitchInput,
    SettingTextInput,
} from "./Inputs.tsx";
import { MdEdit } from "react-icons/md";
import { bucket, useBucket, useBucketSelector } from "react-bucketjs";
import { btGameSettings } from "../actions/buckets";
import { useRef, useState } from "react";
import { updateGameSettings } from "../actions/websocket";

const btShowCreateItem = bucket<any>(false);
const btEditItem = bucket<any>(null);
const btCreateItem = bucket<any>({});
const btDeleteCheck = bucket<any>(false);
const btItemError = bucket<string[]>([]);

export function GameItems() {
    const showCreateItem = useBucket(btShowCreateItem);
    const item = useBucket(btCreateItem);
    const items = useBucketSelector(btGameSettings, (b: any) => b.items);
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
                        {items.map((item: any) => (
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

function AddGameItem() {
    const showCreateItem = useBucket(btShowCreateItem);
    const item = useBucket(btCreateItem);
    const gs = useBucket(btGameSettings);
    const deleteCheck = useBucket(btDeleteCheck);
    const itemErrors = useBucket(btItemError);
    const cancelRef = useRef<any>();

    const onDelete = () => {
        const gameSettings = btGameSettings.get();
        const item = btCreateItem.get();

        gameSettings.items.sort((a: any, b: any) => a.item_order - b.item_order);
        const index = gameSettings?.items
            ?.map((s: any) => s.item_name)
            .indexOf(item.item_name);
        gameSettings.items.splice(index, 1);
        gameSettings.items.forEach((s: any, i: number) => {
            s.item_order = i;
        });

        updateGameSettings(gameSettings);

        btCreateItem.set({});
        btShowCreateItem.set(false);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const onCancel = () => {
        btEditItem.set(null);
        btShowCreateItem.set(null);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const onDone = () => {
        btEditItem.set(null);
        btShowCreateItem.set(null);
        btDeleteCheck.set(false);
        btItemError.set([]);
    };

    const validate = () => {
        const item = btCreateItem.get();
        const items = btGameSettings.get((g: any) => g.items);
        const newErrors: string[] = [];

        let checkItems: any[];
        if (showCreateItem == "edit") {
            checkItems = items.filter((s: any) => s.item_order != item.item_order);
        } else {
            checkItems = items.filter(() => true);
        }
        if (item.item_name == "" || item?.item_name?.trim().length < 3) {
            newErrors.push("Must have a name with at least 3 characters");
        }

        if (item.item_slug == "" || item?.item_slug?.trim().length == 0) {
            newErrors.push("Must have a slug with at least 1 character");
        }
        if (checkItems && checkItems.length > 0) {
            if (checkItems.find((s: any) => s.item_name == item.name)) {
                newErrors.push("Name already exist.");
            }
            if (checkItems.find((s: any) => s.item_slug == item.item_slug)) {
                newErrors.push("Slug already exist.");
            }
        }

        if (newErrors.length > 0) {
            btItemError.set(newErrors);
            return false;
        }

        return true;
    };

    const onCreateOrSave = () => {
        const gameSettings = btGameSettings.get();
        const item = btCreateItem.get();
        if (!gameSettings.items) gameSettings.items = [];

        if (!validate()) {
            return;
        }

        if (typeof item?.item_order === "undefined") {
            item.item_order = gameSettings.items.length;
            gameSettings.items.push(item);
        } else {
            const id = gameSettings?.items
                ?.map((s: any) => s.item_order)
                .indexOf(item.item_order);
            gameSettings.items[id] = item;
        }

        updateGameSettings(gameSettings);

        btEditItem.set(null);
        btShowCreateItem.set(false);
        btItemError.set([]);
    };

    const isReadyForCreate =
        item && item?.item_name?.length > 0 && item?.item_slug?.length > 0;

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
                            {itemErrors && itemErrors.map((error: string) => (
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
                            isDisabled={
                                showCreateItem == "create" && !isReadyForCreate
                            }
                            p="2rem"
                            variant={showCreateItem == "create" ? "primary" : "secondary"}
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

function createItemCategories(newCategories: string[]) {
    newCategories = newCategories || [];
    const gs = btGameSettings.get();
    const items: any[] = gs.items || [];

    let itemCategories: string[] = items
        .filter((item: any) => item.item_category)
        .map((item: any) => item.item_category);

    if (newCategories.length > 0) {
        itemCategories = itemCategories.concat(newCategories);
    }

    itemCategories = itemCategories.filter(
        (value, index, array) => array.indexOf(value) === index
    );

    return itemCategories.map((cat) => ({ label: cat, value: cat }));
}

function CreateItem({ isCreate, index }: { isCreate: boolean; index?: number }) {
    let item = useBucket(btCreateItem);
    const [categories, setCategories] = useState<string[]>([]);

    const useItemTarget = (gameSettings: any, id: string, value: any) => {
        item = btCreateItem.get();
        item[id] = value;
        btCreateItem.set(item);
        if (id == "item_category" && !categories.find((c) => c == value)) {
            categories.push(value);
            setCategories([...categories]);
        }
        return false;
    };
    const useItemValue = (gameSettings: any, id: string) => {
        item = btCreateItem.get();
        return item[id];
    };

    const itemCategories = createItemCategories(categories);

    return (
        <VStack>
            <SettingTextInput
                id="item_slug"
                title="Slug"
                textWidth="13rem"
                helperText="used in player object"
                maxLength={32}
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
            <SettingCreatableInput
                id="item_category"
                title="Category"
                textWidth="13rem"
                helperText="Type to create new category"
                options={itemCategories}
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
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
                title="Expires in (days)"
                helperText="0 = never"
                placeholder="0"
                textWidth={"13rem"}
                theme="row"
                useTarget={useItemTarget}
                useValue={useItemValue}
            />
        </VStack>
    );
}

function GameItem({ item }: { item: any }) {
    const item_order = item?.item_order || 0;
    const isEven = item_order % 2 == 0;

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
                    aria-label="Edit item"
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
