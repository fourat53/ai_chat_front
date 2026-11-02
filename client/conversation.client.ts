import { toast } from "sonner";
import {
	createConversation,
	getConversation,
	updateConversation,
} from "@/actions/conversation.action";
import { getConversationFiles } from "@/actions/file.action";
import { getMessages } from "@/actions/message.action";
import { chat } from "@/client/chat.client";
import { toConvFile } from "@/client/file.client";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

let selectionToken = 0;

function toUiMessages(messages: Message[]): Message[] {
	return messages.map((m) => ({
		id: m.id,
		role: m.role,
		parts: [{ type: "text", text: m.content }],
		...(m.providerName ? { providerName: m.providerName } : {}),
		...(m.modelName ? { modelName: m.modelName } : {}),
	})) as unknown as Message[];
}

async function selectConversation(id: string | null): Promise<boolean> {
	const { setSelectedConv, setLoadingConv, setPendingMeta, setConvFiles } =
		useChatStore.getState();

	if (!id) {
		selectionToken++;
		chat.stop();
		setLoadingConv(false);
		setSelectedConv(null);
		setPendingMeta(null);
		chat.messages = [];
		return true;
	}

	if (useChatStore.getState().selectedConv?.id === id) return true;

	const conversation = useChatStore
		.getState()
		.conversations.find((c) => c.id === id);

	const token = ++selectionToken;
	chat.stop();
	setLoadingConv(true);
	setPendingMeta(null);
	if (conversation) {
		setSelectedConv(conversation);
	}
	chat.messages = [];

	try {
		const full = await getConversation(id);
		if (token !== selectionToken) return false;
		const resolved = full ?? conversation;
		if (!resolved) {
			setSelectedConv(null);
			chat.messages = [];
			toast.error("Conversation not found.");
			return false;
		}
		setSelectedConv(resolved);

		const messages = await getMessages(id);
		if (token !== selectionToken) return false;
		chat.messages = toUiMessages(messages);

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
		toast.error("Failed to load the conversation. Try again.");
		return false;
	} finally {
		if (token === selectionToken) {
			setLoadingConv(false);
		}
	}
}

function clearChatSession(): void {
	useChatStore.getState().resetConversations();
	void selectConversation(null);
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
			if (!created?._id) {
				toast.error("Could not start a new conversation. Try again.");
				return null;
			}
			conversation = { ...created, id: created._id } as Conversation;
		} catch (error) {
			console.error("Failed to create conversation:", error);
			toast.error("Could not start a new conversation. Try again.");
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
	return conversation;
}

async function saveConversationSelection(
	isSignedIn: boolean,
	selection: { providerId?: string; modelId?: string },
): Promise<void> {
	const state = useChatStore.getState();
	const convId = state.selectedConv?.id;
	if (!convId) return;

	state.updateSelectedConv(selection);

	if (!isSignedIn) return;
	try {
		await updateConversation(convId, selection);
	} catch (error) {
		console.error("Failed to save conversation selection:", error);
	}
}

export {
	clearChatSession,
	createNewConversation,
	saveConversationSelection,
	selectConversation,
};
