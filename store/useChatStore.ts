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
	updateSelectedConv: (
		fields: Partial<Omit<Conversation, "id" | "userId">>,
	) => void;
	resetConversations: () => void;
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
	setConvFiles: (conversationId: string, files: ConvFile[]) => void;
	removeConvFile: (conversationId: string, indexId: string) => void;
	toggleConvFileSelected: (conversationId: string, indexId: string) => void;
	// RAG files upload
	uploadingFile: File | null;
	setUploadingFile: (file: File | null) => void;
	uploadPhase: "uploading" | "processing";
	setUploadPhase: (phase: "uploading" | "processing") => void;
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
	updateSelectedConv: (fields) =>
		set((state) => {
			const selectedConv = state.selectedConv;
			if (!selectedConv) return state;
			const updated = { ...selectedConv, ...fields };
			return {
				conversations: state.conversations.map((c) =>
					c.id === updated.id ? updated : c,
				),
				selectedConv: updated,
			};
		}),
	resetConversations: () =>
		set({
			conversations: [],
			selectedConv: null,
			pendingMeta: null,
			convFiles: {},
		}),
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
		set((state) => {
			const current = state.convFiles[conversationId] ?? [];
			const exists = current.some(
				(f) =>
					f.indexId === file.indexId ||
					(file.attachmentId && f.attachmentId === file.attachmentId) ||
					(file.fileKey && f.fileKey === file.fileKey) ||
					(file.hash && f.hash === file.hash),
			);
			if (exists) {
				return {
					convFiles: {
						...state.convFiles,
						[conversationId]: current.map((f) =>
							f.indexId === file.indexId ||
							(file.attachmentId && f.attachmentId === file.attachmentId) ||
							(file.fileKey && f.fileKey === file.fileKey) ||
							(file.hash && f.hash === file.hash)
								? { ...f, ...file, selected: true }
								: f,
						),
					},
				};
			}
			return {
				convFiles: {
					...state.convFiles,
					[conversationId]: [...current, file],
				},
			};
		}),
	removeConvFile: (conversationId, indexId) =>
		set((state) => ({
			convFiles: {
				...state.convFiles,
				[conversationId]: (state.convFiles[conversationId] ?? []).filter(
					(convFile) => convFile.indexId !== indexId,
				),
			},
		})),
	toggleConvFileSelected: (conversationId, indexId) =>
		set((state) => ({
			convFiles: {
				...state.convFiles,
				[conversationId]: (state.convFiles[conversationId] ?? []).map(
					(convFile) =>
						convFile.indexId === indexId
							? { ...convFile, selected: !convFile.selected }
							: convFile,
				),
			},
		})),
	setConvFiles: (conversationId, files) =>
		set((state) => ({
			convFiles: {
				...state.convFiles,
				[conversationId]: files.filter(
					(file, index, self) =>
						index === self.findIndex((f) => f.indexId === file.indexId),
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
}));

export { useChatStore };
