import { create } from "zustand";
import type { Conversation } from "@/types/conversation.type";
import type { MessageMeta } from "@/types/message.type";
import type { Model } from "@/types/model.type";
import type { Provider } from "@/types/provider.type";
import type { RagFile } from "@/types/rag.type";

interface ChatState {
	// Conversations
	conversations: Conversation[];
	setConversations: (
		conversations: Conversation[] | ((prev: Conversation[]) => Conversation[]),
	) => void;
	renameConv: (id: string, title: string) => void;

	selectedConv: Conversation | null;
	setSelectedConv: (conversation: Conversation | null) => void;

	loadingConv: boolean;
	setLoadingConv: (loading: boolean) => void;

	// RAG files
	convRagFiles: Record<string, RagFile[]>;
	addRagFile: (conversationId: string, file: RagFile) => void;
	removeRagFile: (conversationId: string, indexId: string) => void;

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

	// Input
	input: string;
	setInput: (input: string) => void;
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
	renameConv: (id, title) =>
		set((state) =>
			!state.conversations.some((c) => c.id === id) &&
			state.selectedConv?.id !== id
				? state
				: {
						conversations: state.conversations.map((c) =>
							c.id === id ? { ...c, title } : c,
						),
						selectedConv:
							state.selectedConv?.id === id
								? { ...state.selectedConv, title }
								: state.selectedConv,
					},
		),

	selectedConv: null,
	setSelectedConv: (conversation: Conversation | null) =>
		set((state) =>
			state.selectedConv?.id === conversation?.id
				? state
				: { selectedConv: conversation },
		),

	loadingConv: true,
	setLoadingConv: (loading: boolean) =>
		set((state) =>
			state.loadingConv === loading ? state : { loadingConv: loading },
		),

	// RAG files
	convRagFiles: {},
	addRagFile: (conversationId, file) =>
		set((state) => ({
			convRagFiles: {
				...state.convRagFiles,
				[conversationId]: [...(state.convRagFiles[conversationId] ?? []), file],
			},
		})),
	removeRagFile: (conversationId, indexId) =>
		set((state) => ({
			convRagFiles: {
				...state.convRagFiles,
				[conversationId]: (state.convRagFiles[conversationId] ?? []).filter(
					(ragFile) => ragFile.indexId !== indexId,
				),
			},
		})),

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

	// Input
	input: "",
	setInput: (input: string) => set({ input }),
}));

export { useChatStore };
