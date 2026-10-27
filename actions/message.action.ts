"use server";

import { connectDB } from "@/lib/config/db";
import { MessageModel } from "@/models/message.model";
import type { Message } from "@/types/message.type";

export async function getMessages(conversationId: string): Promise<Message[]> {
	await connectDB();

	const docs = await MessageModel.find({ conversationId })
		.sort({ createdAt: 1 })
		.lean();

	const serialized = JSON.parse(JSON.stringify(docs));
	return serialized.map((doc: { _id: string; [key: string]: unknown }) => ({
		...doc,
		id: doc._id,
	})) as Message[];
}

export async function createMessage(data: {
	conversationId: string;
	userId: string;
	role: "user" | "assistant";
	content: string;
	providerName?: string;
	modelName?: string;
}): Promise<Message> {
	await connectDB();

	const doc = new MessageModel(data);
	const result = await doc.save();

	const serialized = JSON.parse(JSON.stringify(result));
	return {
		...serialized,
		id: serialized._id,
	} as Message;
}

export async function deleteMessagesByConversation(
	conversationId: string,
): Promise<void> {
	await connectDB();
	await MessageModel.deleteMany({ conversationId });
}
