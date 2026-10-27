import { model, models, Schema } from "mongoose";
import type { Provider } from "@/types/provider.type";

const providerSchema = new Schema<Provider>(
	{
		label: String,
		name: String,
		baseUrl: String,
	},
	{ timestamps: true },
);

export const ProviderModel =
	models.Provider || model<Provider>("Provider", providerSchema);
