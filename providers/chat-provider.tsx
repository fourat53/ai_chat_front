"use client";

import { useChat as useChatResponse } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import { TextStreamChatTransport } from "ai";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { updateConversation } from "@/actions/conversation.action";
import { selectConversation } from "@/functions/conversation";
import mapToMessage from "@/functions/mapToMessage";
import { useTitleRefresh } from "@/hooks/use-title-refresh";
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
	const selectedConversation = useChatStore((s) => s.selectedConversation);
	const conversations = useChatStore((s) => s.conversations);

	const persistedEntryRef = useRef<{ id: string; length: number }>({
		id: "",
		length: 0,
	});

	const scheduleTitleRefresh = useTitleRefresh();

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

	useEffect(() => {
		if (!selectedConversation && conversations.length > 0) {
			selectConversation(conversations[0].id, { setMessages, stop });
		}
	}, [conversations, selectedConversation, setMessages, stop]);

	useEffect(() => {
		const last = messages[messages.length - 1];
		if (last?.role !== "assistant") return;
		if (status !== "submitted" && status !== "streaming") return;
		const store = useChatStore.getState();
		if (store.assistantMeta[last.id]) return;
		const meta =
			store.pendingMeta ??
			(store.selectedProvider && store.selectedModel
				? {
						providerName: store.selectedProvider.name,
						modelName: store.selectedModel.name,
					}
				: undefined);
		if (meta) store.setAssistantMeta(last.id, meta);
	}, [messages, status]);

	useEffect(() => {
		const run = async () => {
			if (
				status !== "ready" ||
				messages.length === 0 ||
				!selectedConversation?.id
			) {
				return;
			}
			const convId = selectedConversation.id;
			if (
				persistedEntryRef.current.id === convId &&
				messages.length <= persistedEntryRef.current.length
			) {
				return;
			}
			if (persistedEntryRef.current.id !== convId) {
				const knownLength = selectedConversation.messages?.length ?? 0;
				if (messages.length <= knownLength) {
					persistedEntryRef.current = { id: convId, length: messages.length };
					return;
				}
			}
			persistedEntryRef.current = { id: convId, length: messages.length };

			const store = useChatStore.getState();
			const mapped = messages.map((m) =>
				mapToMessage(m, store.assistantMeta[m.id]),
			);
			store.setPendingMeta(null);
			scheduleTitleRefresh(convId, mapped, Boolean(session?.user));

			if (!session?.user) return;
			try {
				await updateConversation(convId, {
					messages: mapped,
					providerId: store.selectedProvider?.id ?? "",
					modelId: store.selectedModel?.id ?? "",
				});
			} catch (err) {
				console.error("Failed to update conversation:", err);
			}
		};

		void run();
	}, [status, messages, session, selectedConversation, scheduleTitleRefresh]);

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
