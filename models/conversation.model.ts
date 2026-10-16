import { model, models, Schema } from "mongoose";
import type { Conversation } from "../types/conversation.type";

const conversationSchema = new Schema<Conversation>({
	userId: String,
	title: String,
	providerId: String,
	modelId: String,
	messages: Schema.Types.Mixed,
});

export const ConversationModel =
	models.Conversation ||
	model<Conversation>("Conversation", conversationSchema);
