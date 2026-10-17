"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ConversationModel } from "@/models/conversation.model";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

async function getUserId(): Promise<string | null> {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		return session?.user?.id ?? null;
	} catch {
		return null;
	}
}

export async function createConversation(data: {
	title: string;
	providerId: string;
	modelId: string;
}) {
	const userId = await getUserId();
	if (!userId) throw new Error("Unauthorized");
	await connectDB();

	const now = new Date();
	const doc = new ConversationModel({
		userId: userId,
		title: data.title,
		providerId: data.providerId,
		modelId: data.modelId,
		messages: [],
		updatedAt: now,
	});

	const result = await doc.save();
	return {
		_id: result._id.toString(),
		userId: result.userId,
		title: result.title,
		providerId: result.providerId,
		modelId: result.modelId,
		messages: result.messages,
	};
}

export async function getConversations(): Promise<Conversation[]> {
	const userId = await getUserId();
	if (!userId) return [];
	await connectDB();

	const docs = await ConversationModel.find({ userId })
		.sort({ updatedAt: -1 })
		.lean();

	const serialized = JSON.parse(JSON.stringify(docs));
	return serialized.map((doc: { _id: string; [key: string]: unknown }) => ({
		...doc,
		id: doc._id,
	})) as Conversation[];
}

export async function getConversation(
	_id: string,
): Promise<Conversation | null> {
	const userId = await getUserId();
	if (!userId) return null;
	await connectDB();

	const doc = await ConversationModel.findOne({ _id, userId }).lean();

	if (!doc) return null;

	const serialized = JSON.parse(JSON.stringify(doc));
	return {
		...serialized,
		id: serialized._id,
	};
}

export async function updateConversation(
	_id: string,
	data: {
		title?: string;
		messages?: Message[];
	},
) {
	const userId = await getUserId();
	if (!userId) throw new Error("Unauthorized");
	await connectDB();

	const update: Record<string, unknown> = {
		updatedAt: new Date(),
	};
	if (data.title !== undefined) update.title = data.title;
	if (data.messages !== undefined) update.messages = data.messages;

	await ConversationModel.updateOne({ _id, userId }, { $set: update });

	return { success: true };
}

export async function deleteConversation(_id: string) {
	const userId = await getUserId();
	if (!userId) throw new Error("Unauthorized");
	await connectDB();

	await ConversationModel.deleteOne({ _id, userId });

	return { success: true };
}
