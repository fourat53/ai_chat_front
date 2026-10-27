"use server";

import { connectDB } from "@/lib/config/db";
import { ProviderModel } from "@/models/provider.model";
import type { Provider } from "@/types/provider.type";

export async function getProviders(): Promise<Provider[]> {
	await connectDB();

	const providers = await ProviderModel.find({
		label: { $nin: ["local-ollama", "lm-studio"] },
	}).lean();

	return providers.map(({ _id, ...p }) => ({
		...p,
		id: _id.toString(),
	})) as Provider[];
}
