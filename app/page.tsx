"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { updateConversation } from "@/actions/conversation.action";
import ChatHeader from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import WaitingDots from "@/components/chat/WaitingDots";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import mapToMessage from "@/functions/mapToMessage";
import { useSession } from "@/lib/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

export default function HomePage() {
	const { data: session } = useSession();
	const { selectedConversation } = useChatStore();
	const lastMessageLength = useRef(0);

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

	useEffect(() => {
		const handleConvUpdate = async () => {
			try {
				if (
					status === "ready" &&
					messages.length > 0 &&
					messages.length > lastMessageLength.current &&
					session?.user &&
					selectedConversation?.id
				) {
					lastMessageLength.current = messages.length;

					await updateConversation(selectedConversation.id, {
						messages: messages.map(mapToMessage),
					});
				}
			} catch (err) {
				console.error("Failed to update conversation:", err);
			}
		};

		void handleConvUpdate();
	}, [status, messages, session, selectedConversation?.id]);

	return (
		<SidebarProvider className="flex overflow-hidden w-full h-screen bg-background">
			<ChatSidebar setMessages={setMessages} session={session} />

			<SidebarInset className="flex relative flex-col flex-1 h-full bg-transparent">
				<ChatHeader />
				<div className="overflow-y-auto flex-1 pt-8 pb-5 space-y-2 lg:rounded-t-xl border border-b-0 border-border bg-background">
					{messages.length > 0 ? (
						<>
							{(messages as Message[]).map((msg) => (
								<MessageBubble
									key={msg.id}
									message={mapToMessage(msg)}
									session={session}
								/>
							))}

							{status === "submitted" && <WaitingDots />}
						</>
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

				<div className="relative lg:mb-4 w-full lg:rounded-b-xl border border-t-0 border-border bg-background">
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
