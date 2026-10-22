import type { ChatStatus } from "ai";
import { useEffect, useRef } from "react";
import { updateConversation } from "@/actions/conversation.action";
import generateTitle from "@/functions/generateTitle";
import mapToMessage from "@/functions/mapToMessage";
import { useSession } from "@/lib/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

type UseTitleRefreshOptions = {
	messages: Message[];
	status: ChatStatus;
};

export function useTitle({ messages, status }: UseTitleRefreshOptions) {
	const { data: session } = useSession();
	const attemptedRef = useRef<Set<string>>(new Set());
	const inFlightRef = useRef<{
		convId: string;
		controller: AbortController;
	} | null>(null);

	const persist = Boolean(session?.user);

	useEffect(() => {
		if (status !== "submitted" && status !== "streaming") return;
		const { selectedConversation } = useChatStore.getState();
		const convId = selectedConversation?.id;
		if (!convId || attemptedRef.current.has(convId)) return;

		if (selectedConversation.title !== "New Chat") {
			attemptedRef.current.add(convId);
			return;
		}

		const firstUserMessage = messages
			.map((m) => mapToMessage(m))
			.find((m) => m.role === "user" && m.content.trim().length > 0);
		if (!firstUserMessage) return;
		attemptedRef.current.add(convId);

		const controller = new AbortController();
		inFlightRef.current = { convId, controller };
		void (async () => {
			try {
				const title = await generateTitle(
					[firstUserMessage],
					controller.signal,
				);
				if (!title || controller.signal.aborted) return;
				useChatStore.getState().renameConversation(convId, title);
				if (persist) {
					await updateConversation(convId, { title });
				}
			} catch (error) {
				console.error("Failed to generate conversation title:", error);
			} finally {
				if (inFlightRef.current?.controller === controller) {
					inFlightRef.current = null;
				}
			}
		})();
	}, [messages, persist, status]);

	useEffect(() => {
		return () => {
			const inFlight = inFlightRef.current;
			inFlight?.controller.abort();
			if (inFlight) attemptedRef.current.delete(inFlight.convId);
		};
	}, []);
}
