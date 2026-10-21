"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { updateConversation } from "@/actions/conversation.action";
import ChatHeader from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import PendingMessage from "@/components/chat/PendingMessage";
import MainLoader from "@/components/reusable/loader/loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { selectConversation } from "@/functions/conversation";
import generateTitle from "@/functions/generateTitle";
import mapToMessage from "@/functions/mapToMessage";
import { useSession } from "@/lib/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Message, MessageMeta } from "@/types/message.type";

export default function HomePage() {
	const { data: session, isPending: sessionPending } = useSession();
	const {
		selectedConversation,
		conversations,
		assistantMeta,
		pendingMeta,
		loadingConversation,
	} = useChatStore();

	const persistedEntryRef = useRef<{ id: string; length: number }>({
		id: "",
		length: 0,
	});

	const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const titleAbortRef = useRef<AbortController | null>(null);

	const transport = useMemo(() => {
		return new TextStreamChatTransport({
			api: "/api/llm/query",
		});
	}, []);

	const { messages, setMessages, stop, sendMessage, status } = useChat<Message>(
		{
			transport,
			onError: (err) => {
				console.error("Chat error:", err);
			},
		},
	);

	const scheduleTitleRefresh = useCallback(
		(convId: string, mapped: Message[]) => {
			clearTimeout(titleDebounceRef.current);
			titleDebounceRef.current = setTimeout(() => {
				const controller = new AbortController();
				titleAbortRef.current?.abort();
				titleAbortRef.current = controller;
				void (async () => {
					try {
						const title = await generateTitle(mapped, controller.signal);
						if (!title || controller.signal.aborted) return;
						const storeState = useChatStore.getState();
						const currentTitle =
							storeState.selectedConversation?.id === convId
								? storeState.selectedConversation?.title
								: storeState.conversations.find((c) => c.id === convId)?.title;
						if (title !== currentTitle) {
							storeState.renameConversation(convId, title);
						}
					} catch (error) {
						console.error("Failed to refresh conversation title:", error);
					}
				})();
			}, 500);
		},
		[],
	);

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
			scheduleTitleRefresh(convId, mapped);

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

	useEffect(() => {
		return () => {
			clearTimeout(titleDebounceRef.current);
			titleAbortRef.current?.abort();
		};
	}, []);

	const resolveMeta = (msg: Message): MessageMeta | undefined => {
		if (msg.providerName && msg.modelName) {
			return { providerName: msg.providerName, modelName: msg.modelName };
		}
		if (assistantMeta[msg.id]) return assistantMeta[msg.id];
		const last = messages[messages.length - 1];
		if (
			msg.id === last?.id &&
			last.role === "assistant" &&
			(status === "submitted" || status === "streaming")
		) {
			return pendingMeta ?? undefined;
		}
		return undefined;
	};

	return (
		<SidebarProvider className="flex overflow-hidden w-full h-screen bg-background">
			<ChatSidebar
				setMessages={setMessages}
				session={session}
				sessionPending={sessionPending}
				stop={stop}
			/>

			<SidebarInset className="flex relative flex-col flex-1 h-full bg-transparent">
				<ChatHeader />
				<div className="overflow-y-auto flex-1 pt-8 pb-5 space-y-2 lg:rounded-t-xl border border-b-0 bg-background">
					{messages.length > 0 ? (
						<>
							{(messages as Message[]).map((msg) => (
								<MessageBubble
									key={msg.id}
									message={mapToMessage(msg)}
									meta={resolveMeta(msg)}
									session={session}
								/>
							))}

							{status === "submitted" && <PendingMessage meta={pendingMeta} />}
						</>
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
								Select a provider and a model, then type a message to start a
								new conversation.
							</p>
						</div>
					)}
				</div>

				<div className="relative lg:mb-4 w-full lg:rounded-b-xl border border-t-0 bg-background">
					<ChatInput
						stop={stop}
						status={status}
						session={session}
						sendMessage={sendMessage}
					/>

					<div className="z-20 text-center p-2 text-xs text-muted-foreground">
						AI can make mistakes. Consider verifying important information.
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
