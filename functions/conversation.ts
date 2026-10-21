import { createConversation } from "@/actions/conversation.action";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

interface SelectConversationOptions {
	setMessages: (messages: Message[]) => void;
	stop?: () => void;
}

export function selectConversation(
	id: string | null,
	{ setMessages, stop }: SelectConversationOptions,
): boolean {
	const {
		conversations,
		providers,
		models,
		setSelectedConversation,
		setSelectedProvider,
		setSelectedModel,
		setLoadingConversation,
	} = useChatStore.getState();

	if (!id) {
		stop?.();
		setSelectedConversation(null);
		setMessages([]);
		return true;
	}

	if (useChatStore.getState().selectedConversation?.id === id) return true;

	const conversation = conversations.find((c) => c.id === id);
	if (!conversation) {
		setLoadingConversation(false);
		return false;
	}

	stop?.();
	setSelectedConversation(conversation);
	setMessages(
		(conversation.messages ?? []).map(
			(m) =>
				({
					id: m.id,
					role: m.role,
					parts: [{ type: "text", text: m.content }],
					...(m.providerName ? { providerName: m.providerName } : {}),
					...(m.modelName ? { modelName: m.modelName } : {}),
				}) as Message,
		),
	);
	setSelectedProvider(
		providers.find((p) => p.id === conversation.providerId) ?? null,
	);
	setSelectedModel(models.find((m) => m.id === conversation.modelId) ?? null);
	setLoadingConversation(false);
	return true;
}

export async function createNewConversation(
	isSignedIn: boolean,
): Promise<Conversation | null> {
	const {
		selectedProvider,
		selectedModel,
		conversations,
		setConversations,
		setSelectedConversation,
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
	setSelectedConversation(conversation);
	return conversation;
}
