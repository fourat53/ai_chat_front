import { create } from "zustand";
import type { Conversation } from "@/types/conversation.type";
import type { ConvFile } from "@/types/file.type";
import type { MessageMeta } from "@/types/message.type";
import type { Model } from "@/types/model.type";
import type { Provider } from "@/types/provider.type";

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
	pendingMeta: MessageMeta | null;
	setPendingMeta: (pendingMeta: MessageMeta | null) => void;

	// Input
	input: string;
	setInput: (input: string) => void;

	// RAG files
	convFiles: Record<string, ConvFile[]>;
	addConvFile: (conversationId: string, file: ConvFile) => void;
	removeConvFile: (conversationId: string, indexId: string) => void;
	// RAG files upload
	uploadingFile: File | null;
	setUploadingFile: (file: File | null) => void;
	uploadPhase: "uploading" | "processing";
	setUploadPhase: (phase: "uploading" | "processing") => void;
	uploadError: string | null;
	setUploadError: (error: string | null) => void;
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
	pendingMeta: null,
	setPendingMeta: (pendingMeta) =>
		set((state) =>
			state.pendingMeta === pendingMeta ? state : { pendingMeta },
		),

	// Input
	input: "",
	setInput: (input: string) => set({ input }),

	// RAG files
	convFiles: {},
	addConvFile: (conversationId, file) =>
		set((state) => ({
			convFiles: {
				...state.convFiles,
				[conversationId]: [...(state.convFiles[conversationId] ?? []), file],
			},
		})),
	removeConvFile: (conversationId, indexId) =>
		set((state) => ({
			convFiles: {
				...state.convFiles,
				[conversationId]: (state.convFiles[conversationId] ?? []).filter(
					(convFile) => convFile.indexId !== indexId,
				),
			},
		})),
	// RAG files upload
	uploadingFile: null,
	setUploadingFile: (file) =>
		set((state) =>
			state.uploadingFile === file ? state : { uploadingFile: file },
		),
	uploadPhase: "uploading",
	setUploadPhase: (phase) =>
		set((state) =>
			state.uploadPhase === phase ? state : { uploadPhase: phase },
		),
	uploadError: null,
	setUploadError: (error) =>
		set((state) =>
			state.uploadError === error ? state : { uploadError: error },
		),
}));

export { useChatStore };
