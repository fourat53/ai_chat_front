import { z } from "zod";

const providerIdParam = z.string().trim().min(1).max(64);

const saveApiKeyInput = z.object({
	providerId: providerIdParam,
	key: z.string().trim().min(8).max(512),
});

type ApiKeyStatus = {
	providerId: string;
	preview: string;
	updatedAt: string;
};

type SaveApiKeyInput = z.infer<typeof saveApiKeyInput>;

export {
	type ApiKeyStatus,
	providerIdParam,
	type SaveApiKeyInput,
	saveApiKeyInput,
};
