import { Chat } from "@ai-sdk/react";
import { toast } from "sonner";
import { createMessage } from "@/actions/message.action";
import { createChatTransport } from "@/client/chat.transport";
import { mapToMessage } from "@/client/message.client";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

export const chat = new Chat<Message>({
	transport: createChatTransport(),
	onFinish: async ({ message, isAbort, isDisconnect, isError }) => {
		if (isAbort || isDisconnect || isError) return;

		const { selectedConv, pendingMeta } = useChatStore.getState();
		if (!selectedConv || selectedConv.userId.startsWith("guest-")) return;

		const content = mapToMessage(message).content;
		if (!content.trim()) return;

		try {
			await createMessage({
				conversationId: selectedConv.id,
				role: "assistant",
				content,
				...(pendingMeta ?? {}),
			});
		} catch (err) {
			console.error("Failed to save assistant message:", err);
		}
	},
	onError: (err) => {
		console.error("Chat error:", err);
		toast.error("The assistant could not complete the response. Try again.");
	},
});
