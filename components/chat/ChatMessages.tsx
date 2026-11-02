"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { updateConversation } from "@/actions/conversation.action";
import { chat } from "@/client/chat.client";
import { mapToMessage } from "@/client/message.client";
import MainLoader from "@/components/loaders/MainLoader";
import { AssistantMessage } from "@/components/messages/AssistantMessage";
import { UserMessage } from "@/components/messages/UserMessage";
import { useTitle } from "@/hooks/use-title";
import { useSession } from "@/lib/auth/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

export default function ChatMessages() {
	const { messages, status, setMessages } = useChat({ chat });
	const loadingConv = useChatStore((s) => s.loadingConv);
	const selectedConv = useChatStore((s) => s.selectedConv);
	const { data: session } = useSession();
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastUserIdRef = useRef<string | undefined>(undefined);
	const anchoredConvIdRef = useRef<string | null>(null);
	const convRef = useRef<{ id: string; length: number }>({
		id: "",
		length: 0,
	});
	const selectedConvId = selectedConv?.id;

	useTitle({ messages, status });

	useEffect(() => {
		if (status !== "submitted" && status !== "streaming") return;
		const lastUserMessageId = messages.findLast(
			(message) => message.role === "user",
		)?.id;
		if (!lastUserMessageId || lastUserIdRef.current === lastUserMessageId) {
			return;
		}
		lastUserIdRef.current = lastUserMessageId;
		requestAnimationFrame(() => {
			const container = scrollRef.current;
			container?.scrollTo({ top: container.scrollHeight });
		});
	}, [messages, status]);

	useLayoutEffect(() => {
		if (loadingConv || messages.length === 0) {
			if (messages.length === 0) {
				anchoredConvIdRef.current = null;
			}
			return;
		}
		if (anchoredConvIdRef.current !== selectedConvId) {
			anchoredConvIdRef.current = selectedConvId ?? null;
			const container = scrollRef.current;
			if (!container) return;
			container.scrollTop = container.scrollHeight;
			const frame = requestAnimationFrame(() => {
				container.scrollTop = container.scrollHeight;
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [loadingConv, messages.length, selectedConvId]);

	useEffect(() => {
		const run = async () => {
			if (status !== "ready" || messages.length === 0 || !selectedConv) return;

			const convId = selectedConv.id;
			if (
				convRef.current.id === convId &&
				messages.length <= convRef.current.length
			)
				return;

			if (convRef.current.id !== convId) {
				if (messages.length <= 0) {
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
					providerId: selectedProvider?.id ?? "",
					modelId: selectedModel?.id ?? "",
				});
			} catch (err) {
				console.error("Failed to update conversation:", err);
			}
		};

		void run();
	}, [selectedConv, setMessages, status, messages, session]);

	const lastIsUser = messages[messages.length - 1]?.role === "user";
	const displayMessages =
		status === "submitted" && lastIsUser
			? [
					...messages,
					{
						id: "pending-assistant",
						conversationId: selectedConvId ?? "",
						userId: "",
						role: "assistant",
						parts: [],
						content: "",
					} as Message,
				]
			: messages;

	if (loadingConv) return <MainLoader />;

	return (
		<div
			ref={scrollRef}
			className="relative flex flex-col h-full pt-6 overflow-y-auto"
		>
			<div className="px-4 sm:px-8 md:px-4 md:mx-auto md:max-w-3xl lg:max-w-4xl">
				{displayMessages.map((msg, index) => {
					const message = mapToMessage(msg);
					return msg.role === "user" ? (
						<UserMessage key={msg.id} message={message} />
					) : (
						<AssistantMessage
							key={msg.id}
							status={status}
							message={message}
							isLast={index === displayMessages.length - 1}
						/>
					);
				})}
			</div>
		</div>
	);
}
