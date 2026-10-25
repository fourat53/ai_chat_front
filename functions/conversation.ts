import {
	createConversation,
	getConversation,
} from "@/actions/conversation.action";
import { getConversationFiles } from "@/actions/file.action";
import { toConvFile } from "@/functions/rag";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

let selectionToken = 0;

function setUrlHash(conversationId: string | null) {
	if (typeof window === "undefined") return;
	const hash = conversationId ? `#${conversationId}` : "";
	if (window.location.hash === hash) return;
	window.history.replaceState(
		null,
		"",
		hash || window.location.pathname + window.location.search,
	);
}

function toUiMessages(messages: Conversation["messages"]): Message[] {
	return (messages ?? []).map(
		(m) =>
			({
				id: m.id,
				role: m.role,
				parts: [{ type: "text", text: m.content }],
				...(m.providerName ? { providerName: m.providerName } : {}),
				...(m.modelName ? { modelName: m.modelName } : {}),
			}) as unknown as Message,
	);
}

interface SelectConversationOptions {
	setMessages: (messages: Message[]) => void;
	stop?: () => void;
}

async function selectConversation(
	id: string | null,
	{ setMessages, stop }: SelectConversationOptions,
): Promise<boolean> {
	const {
		conversations,
		providers,
		models,
		setSelectedConv,
		setSelectedProvider,
		setSelectedModel,
		setLoadingConv,
		setPendingMeta,
		setConvFiles,
	} = useChatStore.getState();

	if (!id) {
		selectionToken++;
		stop?.();
		setSelectedConv(null);
		setPendingMeta(null);
		setUrlHash(null);
		setMessages([]);
		return true;
	}

	if (useChatStore.getState().selectedConv?.id === id) return true;

	const conversation = conversations.find((c) => c.id === id);
	if (!conversation) {
		setLoadingConv(false);
		return false;
	}

	const token = ++selectionToken;
	stop?.();
	setLoadingConv(true);
	setPendingMeta(null);
	setSelectedConv(conversation);
	setUrlHash(id);
	setMessages([]);

	try {
		const full = await getConversation(id);
		if (token !== selectionToken) return false;
		const resolved = full ?? conversation;
		setSelectedConv(resolved);
		setSelectedProvider(
			providers.find((p) => p.id === resolved.providerId) ?? null,
		);
		setSelectedModel(models.find((m) => m.id === resolved.modelId) ?? null);
		setMessages(toUiMessages(full?.messages));

		if (full) {
			try {
				const attachments = await getConversationFiles(id);
				if (token !== selectionToken) return false;
				setConvFiles(id, attachments.map(toConvFile));
			} catch (error) {
				console.error("Failed to load conversation files:", error);
			}
		}
		return true;
	} catch (error) {
		console.error("Failed to load conversation:", error);
		return false;
	} finally {
		if (token === selectionToken) {
			setLoadingConv(false);
		}
	}
}

async function createNewConversation(
	isSignedIn: boolean,
): Promise<Conversation | null> {
	const {
		selectedProvider,
		selectedModel,
		conversations,
		setConversations,
		setSelectedConv,
	} = useChatStore.getState();
	const providerId = selectedProvider?.id ?? "";
	const modelId = selectedModel?.id ?? "";

	let conversation: Conversation;
	if (isSignedIn) {
		try {
			const created = await createConversation({
				title: "New Chat",
				providerId,
				modelId,
			});
			if (!created?._id) return null;
			conversation = { ...created, id: created._id } as Conversation;
		} catch (error) {
			console.error("Failed to create conversation:", error);
			return null;
		}
	} else {
		const id = crypto.randomUUID();
		conversation = {
			id,
			userId: `guest-${id}`,
			title: "New Chat",
			providerId,
			modelId,
		};
	}

	setConversations([conversation, ...conversations]);
	setSelectedConv(conversation);
	setUrlHash(conversation.id);
	return conversation;
}

export { createNewConversation, selectConversation };
