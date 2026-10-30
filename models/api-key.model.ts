import { model, models, Schema, type Types } from "mongoose";

interface ApiKeyDocument {
	userId: Types.ObjectId;
	providerId: string;
	encryptedKey: string;
	preview: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const apiKeySchema = new Schema<ApiKeyDocument>(
	{
		userId: { type: Schema.Types.ObjectId, required: true },
		providerId: { type: String, required: true },
		encryptedKey: { type: String, required: true },
		preview: { type: String, required: true },
	},
	{ timestamps: true },
);

apiKeySchema.index({ userId: 1, providerId: 1 }, { unique: true });

export const ApiKeyModel =
	models.ApiKey || model<ApiKeyDocument>("ApiKey", apiKeySchema);
