import { model, models, Schema, Types } from "mongoose";

const messageSchema = new Schema(
	{
		conversationId: { type: Types.ObjectId, required: true, index: true },
		userId: { type: Types.ObjectId, required: true, index: true },
		role: String,
		content: String,
		providerName: String,
		modelName: String,
	},
	{ timestamps: true },
);

export const MessageModel = models.Message || model("Message", messageSchema);
