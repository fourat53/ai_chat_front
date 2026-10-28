"use server";

import { getUserId } from "@/lib/auth/session";
import { ConversationModel } from "@/models/conversation.model";
import type { Conversation } from "@/types/conversation.type";

async function createConversation(data: {
	title: string;
	providerId: string;
	modelId: string;
}) {
	const userId = await getUserId();

	const conv = await ConversationModel.create({ ...data, userId });
	const serializedConv = JSON.parse(JSON.stringify(conv.toObject()));

	return {
		...serializedConv,
		id: serializedConv._id,
		userId: serializedConv.userId,
	};
}

async function getConversations(): Promise<Conversation[]> {
	const userId = await getUserId();

	const convs = await ConversationModel.find({ userId })
		.sort({ createdAt: -1 })
		.select("userId title providerId modelId")
		.lean();

	const serializedConv = JSON.parse(JSON.stringify(convs));
	return serializedConv.map(
		(doc: { _id: string; userId: string; [key: string]: unknown }) => ({
			...doc,
			id: doc._id,
			userId: doc.userId,
		}),
	);
}

async function getConversation(_id: string): Promise<Conversation | null> {
	const userId = await getUserId();

	const conv = await ConversationModel.findOne({ _id, userId }).lean();

	if (!conv) return null;

	const serializedConv = JSON.parse(JSON.stringify(conv));
	return {
		...serializedConv,
		id: serializedConv._id,
		userId: serializedConv.userId,
	};
}

async function updateConversation(
	_id: string,
	data: {
		title?: string;
		providerId?: string;
		modelId?: string;
	},
) {
	const userId = await getUserId();

	await ConversationModel.updateOne(
		{ _id, userId },
		{ $set: { ...data } },
	);

	return { success: true };
}

async function deleteConversation(_id: string) {
	const userId = await getUserId();

	await ConversationModel.deleteOne({ _id, userId });

	return { success: true };
}

export {
	createConversation,
	deleteConversation,
	getConversation,
	getConversations,
	updateConversation,
};
