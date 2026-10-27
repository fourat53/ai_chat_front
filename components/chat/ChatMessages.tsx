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
		if (loadingConv || !selectedConvId || messages.length === 0) return;
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

	return (
		<div className="relative flex min-h-0 flex-1 flex-col bg-background lg:rounded-t-xl border border-b-0">
			<div
				ref={scrollRef}
				className="overflow-y-auto flex-1 pt-8 pb-5 space-y-2"
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
				) : !isLoading ? (
					<div className="flex flex-col justify-center items-center px-2 mx-auto space-y-4 max-w-md h-full text-center">
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
							How can I help you today?
						</h1>
						<p className="text-muted-foreground">
							Select a provider and a model, then type a message to start a new
							conversation.
						</p>
					</div>
				) : null}
			</div>
			{isLoading && (
				<div className="bg-background lg:rounded-t-xl border-b-2 border-b-transparent absolute inset-0 flex items-center justify-center">
					<MainLoader />
				</div>
			)}
		</div>
	);
}
