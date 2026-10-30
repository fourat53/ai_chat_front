import { toast } from "sonner";
import {
	createConversation,
	getConversation,
	updateConversation,
} from "@/actions/conversation.action";
import { getConversationFiles } from "@/actions/file.action";
import { getMessages } from "@/actions/message.action";
import { toConvFile } from "@/client/file.client";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import type { Message } from "@/types/message.type";

let selectionToken = 0;
let autoSelectionDone = false;

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

function getHashConversationId(): string | null {
	if (typeof window === "undefined") return null;
	return window.location.hash.replace(/^#/, "").trim() || null;
}

function toUiMessages(messages: Message[]): Message[] {
	return messages.map((m) => ({
		id: m.id,
		role: m.role,
		parts: [{ type: "text", text: m.content }],
		...(m.providerName ? { providerName: m.providerName } : {}),
		...(m.modelName ? { modelName: m.modelName } : {}),
	})) as unknown as Message[];
}

interface SelectConversationOptions {
	setMessages: (messages: Message[]) => void;
	stop?: () => void;
}

async function selectConversation(
	id: string | null,
	{ setMessages, stop }: SelectConversationOptions,
): Promise<boolean> {
	autoSelectionDone = true;
	const {
		conversations,
		setSelectedConv,
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
		toast.error("Conversation not found.");
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

		const messages = await getMessages(id);
		if (token !== selectionToken) return false;
		setMessages(toUiMessages(messages));

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

async function ensureInitialSelection({
	setMessages,
	stop,
}: SelectConversationOptions): Promise<void> {
	const { conversations, selectedConv } = useChatStore.getState();
	if (autoSelectionDone || selectedConv || conversations.length === 0) return;
	const hashId = getHashConversationId();
	const target = hashId
		? conversations.find((c) => c.id === hashId)
		: undefined;
	await selectConversation(target?.id ?? conversations[0].id, {
		setMessages,
		stop,
	});
}

function clearChatSession({
	setMessages,
	stop,
}: SelectConversationOptions): void {
	useChatStore.getState().resetConversations();
	void selectConversation(null, { setMessages, stop });
	autoSelectionDone = false;
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
	setUrlHash(conversation.id);
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
	ensureInitialSelection,
	getHashConversationId,
	saveConversationSelection,
	selectConversation,
};
