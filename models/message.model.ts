import { model, models, Schema } from "mongoose";
import type { Message } from "@/types/message.type";

const messageSchema = new Schema<Message>({
	role: String,
	content: String,
});

export const MessageModel =
	models.Message || model<Message>("Message", messageSchema);
