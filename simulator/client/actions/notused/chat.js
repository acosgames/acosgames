import { wsSend } from "./connection";

import fs from 'flatstore';



export function addChatMessage(msg) {

    if (!msg)
        return null;

    if (!msg.payload)
        return null;

    let chatMessages = fs.get('chat');
    if (Array.isArray(msg.payload)) {

        let startOfNewMesssages = 0;
        let lastMessage = chatMessages[chatMessages.length - 1];
        if (lastMessage) {
            for (let i = 0; i < msg.payload.length; i++) {
                if (lastMessage.displayname != msg.payload[i].displayname && lastMessage.timestamp != msg.payload[i].timestamp) {
                    startOfNewMesssages = i;
                    break;
                }
            }
        }


        chatMessages = chatMessages.concat(msg.payload.slice(startOfNewMesssages, msg.payload.length));

    } else {
        chatMessages.push(msg.payload);
    }

    let count = chatMessages.length;
    if (count > 100) {
        chatMessages = chatMessages.slice(count - 100, count);
    }

    fs.set('chat', chatMessages);
    localStorage.setItem('chat', JSON.stringify(chatMessages));

    // localStorage.removeItem(key)
}

export function clearChatMessages() {
    localStorage.removeItem('chat');
    fs.set('chat', []);
}

export function filterChatMessages(chatMessages, chatMode) {
    chatMode = chatMode || 'all';

    if (chatMode == 'game') {
        let game = fs.get('game');
        if (game) {
            let filtered = [];
            for (var msg of chatMessages) {
                if (msg.game_slug == game.game_slug) {
                    filtered.push(msg);
                }
            }
            chatMessages = filtered;
        }
    }
    return chatMessages;
}
export function getChatMessages(chatMode) {

    let chatMessages = fs.get('chat');
    if (!chatMessages) {
        chatMessages = JSON.parse(localStorage.getItem('chat'));
        if (!chatMessages)
            chatMessages = [];
    }

    chatMessages = filterChatMessages(chatMessages, chatMode);

    return chatMessages;
}

export async function sendChatMessage() {

    let message = fs.get('chatMessage');
    if (!message)
        return false;

    let game = fs.get('game');
    let game_slug = game?.game_slug;

    let payload = { message, game_slug }

    await wsSend({ type: 'chat', payload })
}