import { model, models, Schema } from "mongoose";
import type { Model } from "@/types/model.type";

const modelSchema = new Schema<Model>({
	name: String,
	providerId: String,
	description: String,
});

export const ModelModel = models.Model || model<Model>("Model", modelSchema);
