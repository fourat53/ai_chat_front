"use client";

import {
	IconFileText,
	IconLoader2,
	IconPaperclip,
	IconSend,
	IconX,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ModelsSelect from "@/components/selects/ModelsSelect";
import { Button } from "@/components/ui/button";
import { createNewConversation } from "@/functions/conversation";
import {
	createRagIndexId,
	deleteDocument,
	deleteUploadedFile,
	ingestDocument,
	isAcceptedRagFile,
	RAG_ACCEPTED_EXTENSIONS,
	RAG_MAX_FILE_SIZE,
} from "@/functions/rag";
import { useSession } from "@/lib/auth-client";
import { useUploadThing } from "@/lib/uploadthing";
import { useChat } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import type { RagFile } from "@/types/rag.type";

export default function ChatInput() {
	const { data: session } = useSession();
	const { sendMessage, status, stop } = useChat();
	const {
		selectedModel,
		selectedProvider,
		selectedConv,
		setPendingMeta,
		input,
		setInput,
		convRagFiles,
		addRagFile,
		removeRagFile,
	} = useChatStore(
		useShallow((state) => ({
			selectedModel: state.selectedModel,
			selectedProvider: state.selectedProvider,
			selectedConv: state.selectedConv,
			setPendingMeta: state.setPendingMeta,
			input: state.input,
			setInput: state.setInput,
			convRagFiles: state.convRagFiles,
			addRagFile: state.addRagFile,
			removeRagFile: state.removeRagFile,
		})),
	);
	const { startUpload, isUploading: isUploadingToUploadThing } =
		useUploadThing("ragDocument");

	const sendingRef = useRef(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadingFile, setUploadingFile] = useState<File | null>(null);
	const [uploadPhase, setUploadPhase] = useState<"uploading" | "processing">(
		"uploading",
	);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const isUploading = uploadingFile !== null;
	const ragFiles: RagFile[] = selectedConv
		? (convRagFiles[selectedConv.id] ?? [])
		: [];

	const submitMessage = async () => {
		if (sendingRef.current) return;
		const text = input.trim();
		if (!text || !selectedProvider || !selectedModel) return;
		if (status === "submitted" || status === "streaming") return;

		sendingRef.current = true;
		try {
			const conversation =
				selectedConv ?? (await createNewConversation(!!session?.user));
			if (!conversation) return;

			const ragFiles =
				useChatStore.getState().convRagFiles[conversation.id] ?? [];

			setInput("");
			setPendingMeta(
				selectedProvider && selectedModel
					? {
							providerName: selectedProvider.name,
							modelName: selectedModel.name,
						}
					: null,
			);

			await sendMessage(
				{ text },
				{
					body: {
						provider: selectedProvider.label,
						model: selectedModel.id,
						baseUrl: selectedProvider.baseUrl,
						ragFiles: ragFiles.length ? ragFiles : undefined,
					},
				},
			);
		} finally {
			sendingRef.current = false;
		}
	};

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		void submitMessage();
	};

	const isLoading = status === "submitted" || status === "streaming";

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (isLoading) {
				stop();
			} else if (input.trim()) {
				handleSubmit(e as unknown as React.SubmitEvent<HTMLFormElement>);
			}
		}
	};

	const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!isAcceptedRagFile(file)) {
			setUploadError(
				`Unsupported file type. Allowed: ${RAG_ACCEPTED_EXTENSIONS.join(", ")}`,
			);
			return;
		}
		if (file.size > RAG_MAX_FILE_SIZE) {
			setUploadError("File exceeds the 15 MB size limit.");
			return;
		}

		setUploadingFile(file);
		setUploadPhase("uploading");
		setUploadError(null);
		try {
			const conversation =
				selectedConv ?? (await createNewConversation(!!session?.user));
			if (!conversation) throw new Error("Could not create a conversation");
			const indexId = createRagIndexId(conversation.id);

			const results = await startUpload([file]);
			const uploaded = results?.[0];
			if (!uploaded) throw new Error("File upload to UploadThing failed");

			setUploadPhase("processing");
			await ingestDocument(uploaded.ufsUrl, uploaded.name, indexId);

			addRagFile(conversation.id, {
				indexId,
				fileName: uploaded.name,
				fileKey: uploaded.key,
			});
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : "Upload failed, try again",
			);
		} finally {
			setUploadingFile(null);
		}
	};

	const handleRemoveFile = (ragFile: RagFile) => {
		if (selectedConv?.id) {
			removeRagFile(selectedConv.id, ragFile.indexId);
		}
		void deleteDocument(ragFile.indexId);
		void deleteUploadedFile(ragFile.fileKey);
	};

	const uploadChipLabel =
		uploadPhase === "uploading"
			? `Uploading ${uploadingFile?.name}...`
			: `Processing ${uploadingFile?.name}...`;

	return (
		<div className="px-2 sm:px-4 md:px-0 lg:px-4 md:mx-auto md:max-w-2xl lg:max-w-3xl">
			<form
				onSubmit={handleSubmit}
				className="rounded-3xl border shadow-xl transition-all bg-sidebar focus-within:ring-2 focus-within:ring-ring/50"
			>
				<input
					ref={fileInputRef}
					type="file"
					accept={RAG_ACCEPTED_EXTENSIONS.join(",")}
					className="hidden"
					onChange={handleFileSelected}
				/>

				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything..."
					className="w-full max-h-96 min-h-12 resize-none p-4 pb-2 outline-none text-sm placeholder:text-muted-foreground rounded-t-3xl"
					rows={1}
					style={{ height: "auto" }}
					onInput={(e) => {
						const target = e.target as HTMLTextAreaElement;
						target.style.height = "auto";
						target.style.height = `${target.scrollHeight}px`;
					}}
				/>

				{(ragFiles.length > 0 || uploadingFile || uploadError) && (
					<div className="flex flex-wrap gap-2 items-center px-4 pb-1">
						{ragFiles.map((ragFile) => (
							<span
								key={ragFile.indexId}
								className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-2.5 pr-1 text-xs text-foreground"
							>
								<IconFileText
									size={14}
									className="shrink-0 text-muted-foreground"
								/>
								<span
									title={ragFile.fileName}
									className="max-w-20 sm:max-w-30 truncate"
								>
									{ragFile.fileName}
								</span>
								<Button
									variant="ghost"
									size="icon"
									type="button"
									className="rounded-full size-5 hover:text-foreground"
									onClick={() => handleRemoveFile(ragFile)}
								>
									<IconX size={12} />
								</Button>
							</span>
						))}

						{uploadingFile && (
							<span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-2.5 pr-2.5 text-xs text-muted-foreground">
								<IconLoader2 size={14} className="shrink-0 animate-spin" />
								<span className="max-w-40 sm:max-w-56 truncate">
									{uploadChipLabel}
								</span>
							</span>
						)}

						{uploadError && (
							<span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 py-1 pl-2.5 pr-1 text-xs text-destructive">
								{uploadError}
								<Button
									variant="ghost"
									size="icon"
									type="button"
									className="rounded-full size-5 hover:text-destructive"
									onClick={() => setUploadError(null)}
								>
									<IconX size={12} />
								</Button>
							</span>
						)}
					</div>
				)}

				<div className="z-10 flex flex-wrap gap-1 sm:gap-2 justify-between items-center p-2 pt-0">
					<div className="flex flex-wrap gap-1 sm:gap-2 items-center">
						<Button
							variant="ghost"
							size="icon"
							type="button"
							disabled={isUploading || isUploadingToUploadThing}
							className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
							onClick={() => fileInputRef.current?.click()}
						>
							{isUploading || isUploadingToUploadThing ? (
								<IconLoader2 className="animate-spin" size={20} />
							) : (
								<IconPaperclip size={20} />
							)}
						</Button>

						<div className="mx-px w-px h-4 bg-border" />

						<ModelsSelect />
					</div>

					<Button
						size="icon"
						type="submit"
						className="rounded-full size-8 sm:size-9"
						disabled={
							isUploading ||
							isUploadingToUploadThing ||
							(!isLoading && (!input || input.trim() === ""))
						}
						icon={
							isLoading ? (
								<IconLoader2 className="animate-spin" />
							) : (
								<IconSend />
							)
						}
						onClick={(event) => {
							if (!isLoading) return;
							event.preventDefault();
							stop();
						}}
					/>
				</div>
			</form>
		</div>
	);
}
