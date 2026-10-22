import { useCallback, useEffect, useRef } from "react";
import { updateConversation } from "@/actions/conversation.action";
import generateTitle from "@/functions/generateTitle";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

const NEW_CHAT_TITLE = "New Chat";

export function useTitleRefresh() {
	const abortRef = useRef<AbortController | null>(null);

	const scheduleTitleRefresh = useCallback(
		(convId: string, mapped: Message[], persist: boolean) => {
			const findConversation = (): Conversation | undefined => {
				const state = useChatStore.getState();
				return state.selectedConversation?.id === convId
					? state.selectedConversation
					: state.conversations.find((c) => c.id === convId);
			};

			const conversation = findConversation();
			if (!conversation) return;
			const previousTitle =
				conversation.title === NEW_CHAT_TITLE ? "" : conversation.title;

			const controller = new AbortController();
			abortRef.current?.abort();
			abortRef.current = controller;
			void (async () => {
				try {
					const title = await generateTitle(
						mapped,
						previousTitle,
						controller.signal,
					);
					if (!title || controller.signal.aborted) return;
					const currentTitle = findConversation()?.title;
					if (!currentTitle || title === currentTitle) return;
					useChatStore.getState().renameConversation(convId, title);
					if (persist) {
						await updateConversation(convId, { title });
					}
				} catch (error) {
					console.error("Failed to refresh conversation title:", error);
				}
			})();
		},
		[],
	);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	return scheduleTitleRefresh;
}
