"use client";

import { useChat as useChatResponse } from "@ai-sdk/react";
import { type ChatStatus, TextStreamChatTransport } from "ai";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { updateConversation } from "@/actions/conversation.action";
import { selectConversation } from "@/functions/conversation";
import { mapToMessage } from "@/functions/message";
import { useTitle } from "@/hooks/use-title";
import { useSession } from "@/lib/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

interface ChatContextValue {
	messages: Message[];
	setMessages: (messages: Message[]) => void;
	stop: () => void;
	sendMessage: (
		message: { text: string },
		options?: { body?: object },
	) => Promise<void>;
	status: ChatStatus;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export default function ChatProvider({ children }: { children: ReactNode }) {
	const { data: session } = useSession();
	const { conversations, selectedConversation } = useChatStore(
		useShallow((s) => ({
			conversations: s.conversations,
			selectedConversation: s.selectedConversation,
		})),
	);

	const convRef = useRef<{ id: string; length: number }>({
		id: "",
		length: 0,
	});

	const transport = useMemo(() => {
		return new TextStreamChatTransport({
			api: "/api/llm/query",
		});
	}, []);

	const { messages, setMessages, stop, sendMessage, status } =
		useChatResponse<Message>({
			transport,
			onError: (err) => {
				console.error("Chat error:", err);
			},
		});

	useTitle({ messages, status });

	useEffect(() => {
		if (
			convRef.current.id === "" &&
			!selectedConversation &&
			conversations.length > 0
		) {
			const hashId = window.location.hash.replace(/^#/, "").trim();
			const target = hashId
				? conversations.find((c) => c.id === hashId)
				: undefined;
			void selectConversation(target?.id ?? conversations[0].id, {
				setMessages,
				stop,
			});
		}
	}, [conversations, selectedConversation, setMessages, stop]);

	useEffect(() => {
		const run = async () => {
			if (
				status !== "ready" ||
				messages.length === 0 ||
				!selectedConversation?.id
			)
				return;

			const convId = selectedConversation.id;
			if (
				convRef.current.id === convId &&
				messages.length <= convRef.current.length
			)
				return;

			if (convRef.current.id !== convId) {
				const knownLength = selectedConversation.messages?.length ?? 0;
				if (messages.length <= knownLength) {
					convRef.current = { id: convId, length: messages.length };
					return;
				}
			}
			convRef.current = { id: convId, length: messages.length };

			const { selectedProvider, selectedModel, pendingMeta } =
				useChatStore.getState();
			const lastMessageIndex = messages.length - 1;
			const mapped = messages.map((m, index) => {
				const mappedMessage = mapToMessage(m);
				if (
					!pendingMeta ||
					m.role !== "assistant" ||
					index !== lastMessageIndex ||
					(mappedMessage.providerName && mappedMessage.modelName)
				) {
					return mappedMessage;
				}
				return { ...mappedMessage, ...pendingMeta };
			});

			setMessages(mapped);

			if (!session?.user) return;
			try {
				await updateConversation(convId, {
					messages: mapped,
					providerId: selectedProvider?.id ?? "",
					modelId: selectedModel?.id ?? "",
				});
			} catch (err) {
				console.error("Failed to update conversation:", err);
			}
		};

		void run();
	}, [selectedConversation, setMessages, status, messages, session]);

	const value = useMemo<ChatContextValue>(
		() => ({ messages, setMessages, stop, sendMessage, status }),
		[messages, setMessages, stop, sendMessage, status],
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChat must be used within a ChatProvider");
	}
	return context;
}
