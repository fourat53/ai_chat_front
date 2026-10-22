import { create } from "zustand";
import type { Conversation } from "@/types/conversation.type";
import type { MessageMeta } from "@/types/message.type";
import type { Model } from "@/types/model.type";
import type { Provider } from "@/types/provider.type";

interface ChatState {
	// Conversations
	conversations: Conversation[];
	setConversations: (
		conversations: Conversation[] | ((prev: Conversation[]) => Conversation[]),
	) => void;
	renameConversation: (id: string, title: string) => void;

	selectedConversation: Conversation | null;
	setSelectedConversation: (conversation: Conversation | null) => void;

	loadingConversation: boolean;
	setLoadingConversation: (loading: boolean) => void;

	// Providers
	providers: Provider[];
	setProviders: (providers: Provider[]) => void;

	selectedProvider: Provider | null;
	setSelectedProvider: (provider: Provider | null) => void;

	// Models
	models: Model[];
	setModels: (models: Model[]) => void;

	selectedModel: Model | null;
	setSelectedModel: (model: Model | null) => void;

	// Pending Model Metadata
	pendingMeta: MessageMeta | null;
	setPendingMeta: (pendingMeta: MessageMeta | null) => void;
}

const useChatStore = create<ChatState>((set) => ({
	// Conversations
	conversations: [],
	setConversations: (conversations) =>
		set((state) => ({
			conversations:
				typeof conversations === "function"
					? conversations(state.conversations)
					: conversations,
		})),
	renameConversation: (id, title) =>
		set((state) =>
			!state.conversations.some((c) => c.id === id) &&
			state.selectedConversation?.id !== id
				? state
				: {
						conversations: state.conversations.map((c) =>
							c.id === id ? { ...c, title } : c,
						),
						selectedConversation:
							state.selectedConversation?.id === id
								? { ...state.selectedConversation, title }
								: state.selectedConversation,
					},
		),

	selectedConversation: null,
	setSelectedConversation: (conversation: Conversation | null) =>
		set((state) =>
			state.selectedConversation?.id === conversation?.id
				? state
				: { selectedConversation: conversation },
		),

	loadingConversation: true,
	setLoadingConversation: (loading: boolean) =>
		set((state) =>
			state.loadingConversation === loading
				? state
				: { loadingConversation: loading },
		),

	// Providers
	providers: [],
	setProviders: (providers: Provider[]) => set({ providers }),

	selectedProvider: null,
	setSelectedProvider: (provider: Provider | null) =>
		set((state) =>
			state.selectedProvider?.id === provider?.id
				? state
				: { selectedProvider: provider },
		),

	// Models
	models: [],
	setModels: (models: Model[]) => set({ models }),

	selectedModel: null,
	setSelectedModel: (model: Model | null) =>
		set((state) =>
			state.selectedModel?.id === model?.id ? state : { selectedModel: model },
		),

	// Pending Model Metadata
	pendingMeta: null,
	setPendingMeta: (pendingMeta) =>
		set((state) =>
			state.pendingMeta === pendingMeta ? state : { pendingMeta },
		),
}));

export { useChatStore };
