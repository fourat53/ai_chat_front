import type { UIMessage } from "ai";
import { z } from "zod";

enum ChatRole {
	USER = "user",
	ASSISTANT = "assistant",
}

type MessageMeta = {
	providerName: string;
	modelName: string;
};

const message = z.object({
	id: z.string(),
	conversationId: z.string(),
	userId: z.string(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
	providerName: z.string().optional(),
	modelName: z.string().optional(),
});

type Message = z.infer<typeof message> & UIMessage;
type MessageBody = Omit<Message, "id">;

export { ChatRole, type Message, type MessageBody, type MessageMeta, message };
