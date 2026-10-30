import "server-only";

import { decryptApiKey } from "@/lib/api-keys/crypto";
import { connectDB } from "@/lib/config/db";
import { ApiKeyModel } from "@/models/api-key.model";

async function resolveUserApiKey(
	userId: string | null,
	providerId: string | null,
): Promise<string | null> {
	if (!userId || !providerId) return null;

	await connectDB();
	const stored = await ApiKeyModel.findOne(
		{ userId, providerId },
		{ encryptedKey: 1 },
	).lean();
	if (!stored?.encryptedKey) return null;

	try {
		return decryptApiKey(stored.encryptedKey);
	} catch (error) {
		console.error("Failed to decrypt the stored API key:", error);
		return null;
	}
}

export { resolveUserApiKey };
