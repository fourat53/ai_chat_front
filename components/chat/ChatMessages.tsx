"use client";

import { ChatMessage } from "@/components/chat/ChatMessage";
import MainLoader from "@/components/loaders/MainLoader";
import mapToMessage from "@/functions/mapToMessage";
import { useSession } from "@/lib/auth-client";
import { useChat } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import type { Message, MessageMeta } from "@/types/message.type";
import { LoaderDots } from "../loaders/WaitingDots";

export default function ChatMessages() {
	const { messages, status } = useChat();
	const { assistantMeta, pendingMeta, loadingConversation } = useChatStore();
	const { data: session } = useSession();

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
		<div className="overflow-y-auto flex-1 pt-8 pb-5 space-y-2 lg:rounded-t-xl border border-b-0 bg-background">
			{messages.length > 0 ? (
				<>
					{messages.map((msg) => (
						<ChatMessage
							key={msg.id}
							message={mapToMessage(msg)}
							meta={resolveMeta(msg)}
							session={session}
						/>
					))}

					{status === "submitted" && (
						<div className="px-4 sm:px-8 md:px-4 lg:px-8 md:mx-auto md:max-w-2xl lg:max-w-3xl flex flex-col gap-1 w-full rounded-2xl">
							{pendingMeta && (
								<div className="flex flex-wrap gap-1.5 font-medium items-center text-xs text-muted-foreground">
									<span>{pendingMeta.providerName}</span>
									<span className="text-lg font-semibold">·</span>
									<span>{pendingMeta.modelName}</span>
								</div>
							)}
							<LoaderDots />
						</div>
					)}
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
						Select a provider and a model, then type a message to start a new
						conversation.
					</p>
				</div>
			)}
		</div>
	);
}
