import { model, models, Schema } from "mongoose";

const conversationSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, required: true, index: true },
		providerId: String,
		modelId: String,
		title: String,
	},
	{ timestamps: true },
);

export const ConversationModel =
	models.Conversation || model("Conversation", conversationSchema);
