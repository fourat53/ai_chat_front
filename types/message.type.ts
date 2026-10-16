import type { UIMessage } from "ai";
import { z } from "zod";

enum ChatRole {
	USER = "user",
	ASSISTANT = "assistant",
}

const message = z.object({
	id: z.string(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
});

type Message = z.infer<typeof message> & UIMessage;
type MessageBody = Omit<Message, "id">;

export { ChatRole, type Message, type MessageBody, message };
