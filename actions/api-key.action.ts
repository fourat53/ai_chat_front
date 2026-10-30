"use server";

import { encryptApiKey } from "@/lib/api-keys/crypto";
import { getUserId } from "@/lib/auth/session";
import { connectDB } from "@/lib/config/db";
import { ApiKeyModel } from "@/models/api-key.model";
import {
	type ApiKeyStatus,
	providerIdParam,
	type SaveApiKeyInput,
	saveApiKeyInput,
} from "@/types/api-key.type";

async function getSavedApiKeys(): Promise<ApiKeyStatus[]> {
	const userId = await getUserId();
	await connectDB();
	const saved = await ApiKeyModel.find(
		{ userId },
		{ providerId: 1, preview: 1, updatedAt: 1 },
	).lean();

	return saved.map(({ providerId, preview, updatedAt }) => ({
		providerId,
		preview,
		updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
	}));
}

async function saveApiKey(input: SaveApiKeyInput): Promise<ApiKeyStatus> {
	const userId = await getUserId();
	const { providerId, key } = saveApiKeyInput.parse(input);

	const saved = await ApiKeyModel.findOneAndUpdate(
		{ userId, providerId },
		{ $set: { encryptedKey: encryptApiKey(key), preview: key.slice(-4) } },
		{
			upsert: true,
			new: true,
			projection: { providerId: 1, preview: 1, updatedAt: 1 },
		},
	).lean();

	if (!saved) {
		throw new Error("Failed to save the API key");
	}

	return {
		providerId: saved.providerId,
		preview: saved.preview,
		updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : "",
	};
}

async function deleteApiKey(providerId: string): Promise<void> {
	const userId = await getUserId();
	const value = providerIdParam.parse(providerId);

	await connectDB();
	await ApiKeyModel.deleteOne({ userId, providerId: value });
}

export { deleteApiKey, getSavedApiKeys, saveApiKey };
