"use server";

import { getUserId } from "@/lib/auth/session";
import { ConversationModel } from "@/models/conversation.model";
import { MessageModel } from "@/models/message.model";
import type { Message } from "@/types/message.type";

export async function getMessages(conversationId: string): Promise<Message[]> {
	const userId = await getUserId();

	const msgs = await MessageModel.find({ conversationId, userId })
		.sort({ createdAt: 1 })
		.lean();

	const serializedMsg = JSON.parse(JSON.stringify(msgs));
	return serializedMsg.map((doc: { _id: string; [key: string]: unknown }) => ({
		...doc,
		id: doc._id,
	})) as Message[];
}

export async function createMessage(data: {
	conversationId: string;
	role: "user" | "assistant";
	content: string;
	providerName?: string;
	modelName?: string;
}): Promise<Message> {
	const userId = await getUserId();

	const conversation = await ConversationModel.findOne(
		{ _id: data.conversationId, userId },
		{ _id: 1 },
	).lean();
	if (!conversation) {
		throw new Error("Conversation not found.");
	}

	const msg = new MessageModel({ ...data, userId });
	const result = await msg.save();

	const serializedMsg = JSON.parse(JSON.stringify(result));
	return {
		...serializedMsg,
		id: serializedMsg._id,
	} as Message;
}

export async function deleteMessagesByConversation(
	conversationId: string,
): Promise<void> {
	const userId = await getUserId();

	await MessageModel.deleteMany({ conversationId, userId });
}
