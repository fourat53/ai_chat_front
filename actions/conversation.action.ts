"use server";

import { getUserId } from "@/actions/user.action";
import { ConversationModel } from "@/models/conversation.model";
import type { Conversation } from "@/types/conversation.type";

async function createConversation(data: {
	title: string;
	providerId: string;
	modelId: string;
}) {
	const userId = await getUserId();

	const conv = await ConversationModel.create({
		...data,
		userId,
	});
	const plainConv = conv.toObject();

	return {
		...plainConv,
		id: plainConv._id.toString(),
		userId: plainConv.userId.toString(),
	};
}

async function getConversations(): Promise<Conversation[]> {
	const userId = await getUserId();

	const docs = await ConversationModel.find({ userId })
		.sort({ updatedAt: -1 })
		.select("userId title providerId modelId updatedAt")
		.lean();

	return docs.map((doc) => ({
		...doc,
		id: doc._id.toString(),
		userId: doc.userId.toString(),
	}));
}

async function getConversation(_id: string): Promise<Conversation | null> {
	const userId = await getUserId();

	const doc = await ConversationModel.findOne({ _id, userId }).lean();

	if (!doc) return null;

	return {
		...doc,
		id: doc._id.toString(),
		userId: doc.userId.toString(),
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
		{ $set: { ...data, updatedAt: new Date() } },
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
