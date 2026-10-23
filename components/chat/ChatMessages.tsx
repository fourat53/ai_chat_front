"use client";

import { useEffect, useRef } from "react";
import MainLoader from "@/components/loaders/MainLoader";
import { AssistantMessage } from "@/components/messages/AssistantMessage";
import { UserMessage } from "@/components/messages/UserMessage";
import { mapToMessage } from "@/functions/message";
import { useChat } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

export default function ChatMessages() {
	const { messages, status } = useChat();
	const loadingConversation = useChatStore((s) => s.loadingConversation);
	const selectedConversationId = useChatStore(
		(s) => s.selectedConversation?.id,
	);
	const scrollRef = useRef<HTMLDivElement>(null);
	const scrolledUserIdRef = useRef<string | undefined>(undefined);
	const scrolledConvRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (status !== "submitted" && status !== "streaming") return;
		const lastUserMessageId = messages.findLast(
			(message) => message.role === "user",
		)?.id;
		if (!lastUserMessageId || scrolledUserIdRef.current === lastUserMessageId) {
			return;
		}
		scrolledUserIdRef.current = lastUserMessageId;
		requestAnimationFrame(() => {
			const container = scrollRef.current;
			container?.scrollTo({ top: container.scrollHeight });
		});
	}, [messages, status]);

	useEffect(() => {
		if (
			loadingConversation ||
			!selectedConversationId ||
			messages.length === 0 ||
			scrolledConvRef.current === selectedConversationId
		)
			return;
		scrolledConvRef.current = selectedConversationId;
		requestAnimationFrame(() => {
			const container = scrollRef.current;
			container?.scrollTo({ top: container.scrollHeight });
		});
	}, [loadingConversation, messages, selectedConversationId]);

	const lastIsUser = messages[messages.length - 1]?.role === "user";
	const displayMessages =
		status === "submitted" && lastIsUser
			? [
					...messages,
					{
						id: "pending-assistant",
						role: "assistant",
						parts: [],
						content: "",
					} as Message,
				]
			: messages;

	return (
		<div
			ref={scrollRef}
			className="overflow-y-auto flex-1 pt-8 pb-5 space-y-2 lg:rounded-t-xl border border-b-0 bg-background"
		>
			{messages.length > 0 ? (
				displayMessages.map((msg, index) => {
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
				})
			) : loadingConversation ? (
				<div className="h-full w-full flex justify-center items-center">
					<MainLoader />
				</div>
			) : (
				<div className="flex flex-col justify-center items-center px-2 mx-auto space-y-4 max-w-md h-full text-center">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
						How can I help you today?
					</h1>
					<p className="text-muted-foreground">
						Select a provider and a model, then type a message to start a new
						conversation.
					</p>
				</div>
			)}
		</div>
	);
}
