import { create } from "zustand";
import type { Conversation } from "@/types/conversation.type";
import type { Model } from "@/types/model.type";
import type { Provider } from "@/types/provider.type";

interface ChatState {
	//Conversations
	conversations: Conversation[];
	setConversations: (conversations: Conversation[]) => void;

	selectedConversation: Conversation | null;
	setSelectedConversation: (conversation: Conversation | null) => void;

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

	// Input
	input: string;
	setInput: (input: string) => void;
}

const useChatStore = create<ChatState>((set) => ({
	//Conversations
	conversations: [],
	setConversations: (conversations: Conversation[]) => set({ conversations }),

	selectedConversation: null,
	setSelectedConversation: (conversation: Conversation | null) =>
		set((state) =>
			state.selectedConversation?.id === conversation?.id
				? state
				: { selectedConversation: conversation },
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

	// Input
	input: "",
	setInput: (input: string) =>
		set((state) => (state.input === input ? state : { input })),
}));

export { useChatStore };
