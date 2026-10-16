"use server";

import { connectDB } from "@/lib/db";
import { ProviderModel } from "@/models/provider.model";
import type { Provider } from "@/types/provider.type";

export async function getProviders(): Promise<Provider[]> {
	await connectDB();
	const providers = await ProviderModel.find({}, {}).lean();
	const serialized = JSON.parse(JSON.stringify(providers));
	return serialized.map((p: { _id: string; [key: string]: unknown }) => ({
		...p,
		id: p._id,
	})) as Provider[];
}
