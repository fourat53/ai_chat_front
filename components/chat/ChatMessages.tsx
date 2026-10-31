"use client";

import { useEffect, useRef, useState } from "react";
import { mapToMessage } from "@/client/message.client";
import MainLoader from "@/components/loaders/MainLoader";
import { AssistantMessage } from "@/components/messages/AssistantMessage";
import { UserMessage } from "@/components/messages/UserMessage";
import { useChatContext } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

export default function ChatMessages() {
	const { messages, status } = useChatContext();
	const loadingConv = useChatStore((s) => s.loadingConv);
	const selectedConvId = useChatStore((s) => s.selectedConv?.id);
	const scrollRef = useRef<HTMLDivElement>(null);
	const scrolledUserIdRef = useRef<string | undefined>(undefined);
	const [scrolledForConvId, setScrolledForConvId] = useState<string | null>(
		null,
	);

	const hasUrlConv =
		typeof window !== "undefined" &&
		Boolean(window.location.hash.replace(/^#/, "").trim());

	const isPendingScroll =
		!loadingConv &&
		!!selectedConvId &&
		messages.length > 0 &&
		scrolledForConvId !== selectedConvId;

	const isLoading =
		loadingConv || isPendingScroll || (hasUrlConv && !selectedConvId);

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
		if (!selectedConvId || messages.length === 0) {
			setScrolledForConvId(null);
			return;
		}
		if (loadingConv) return;
		if (scrolledForConvId === selectedConvId) return;

		const container = scrollRef.current;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
		const frame = requestAnimationFrame(() => {
			if (container) {
				container.scrollTop = container.scrollHeight;
			}
			setScrolledForConvId(selectedConvId);
		});
		return () => cancelAnimationFrame(frame);
	}, [loadingConv, messages.length, selectedConvId, scrolledForConvId]);

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

	if (isLoading) return <MainLoader />;

	return (
		<div
			ref={scrollRef}
			className="relative flex flex-col h-full pt-6 overflow-y-auto"
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
			) : (
				<div className="flex flex-col items-center justify-center h-full max-w-md px-2 mx-auto space-y-4 text-center">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
