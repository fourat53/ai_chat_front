"use client";

import {
	IconFileText,
	IconLoader2,
	IconPaperclip,
	IconX,
} from "@tabler/icons-react";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	completeFileUpload,
	markFileReady,
	removeConversationFile,
	reserveConversationFile,
} from "@/actions/file.action";
import { Button } from "@/components/ui/button";
import { createNewConversation } from "@/functions/conversation";
import {
	computeFileHash,
	createRagIndexId,
	deleteDocument,
	deleteUploadedFile,
	ingestDocument,
	isAcceptedRagFile,
	RAG_ACCEPTED_EXTENSIONS,
	RAG_MAX_FILE_SIZE,
	toConvFile,
} from "@/functions/rag";
import { useSession } from "@/lib/auth-client";
import { useUploadThing } from "@/lib/uploadthing";
import { useChatStore } from "@/store/useChatStore";
import type { Attachment, ConvFile } from "@/types/file.type";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { FileViewer } from "../ui/doc-viewer";

function ChatFiles() {
	const {
		selectedConv,
		convFiles,
		removeConvFile,
		addConvFile,
		uploadingFile,
		uploadPhase,
		uploadError,
		setUploadError,
	} = useChatStore(
		useShallow((state) => ({
			selectedConv: state.selectedConv,
			convFiles: state.convFiles,
			removeConvFile: state.removeConvFile,
			addConvFile: state.addConvFile,
			uploadingFile: state.uploadingFile,
			uploadPhase: state.uploadPhase,
			uploadError: state.uploadError,
			setUploadError: state.setUploadError,
		})),
	);

	const ragFiles: ConvFile[] = selectedConv
		? (convFiles[selectedConv.id] ?? [])
		: [];

	const handleRemoveFile = async (ragFile: ConvFile) => {
		const conversationId = selectedConv?.id;
		if (conversationId) {
			removeConvFile(conversationId, ragFile.indexId);
		}

		if (ragFile.attachmentId && conversationId) {
			try {
				await removeConversationFile(ragFile.attachmentId, conversationId);
			} catch (error) {
				console.error("Failed to remove file:", error);
				addConvFile(conversationId, ragFile);
				setUploadError("Failed to remove the file. Try again.");
			}
			return;
		}

		void deleteDocument(ragFile.indexId);
		void deleteUploadedFile(ragFile.fileKey);
	};

	const uploadChipLabel =
		uploadPhase === "uploading"
			? `Uploading ${uploadingFile?.name}...`
			: `Processing ${uploadingFile?.name}...`;

	if (!(ragFiles.length > 0 || uploadingFile || uploadError)) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-2 items-center px-4 pb-1">
			{ragFiles.map((ragFile) => (
				<Dialog key={ragFile.indexId}>
					<span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 text-xs text-foreground">
						<DialogTrigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5">
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
						</DialogTrigger>
						<Button
							variant="ghost"
							size="icon"
							type="button"
							className="rounded-full size-5 hover:text-foreground"
							onClick={() => {
								void handleRemoveFile(ragFile);
							}}
						>
							<IconX size={12} />
						</Button>
					</span>

					<DialogContent className="sm:max-w-3xl">
						<DialogHeader>
							<DialogTitle>{ragFile.fileName}</DialogTitle>
						</DialogHeader>
						{ragFile.fileUrl ? (
							<FileViewer file={ragFile.fileUrl} />
						) : (
							<p className="text-sm text-muted-foreground">
								Preview is not available for this file.
							</p>
						)}
					</DialogContent>
				</Dialog>
			))}

			{uploadingFile && (
				<span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-2.5 pr-2.5 text-xs text-muted-foreground">
					<IconLoader2 size={14} className="shrink-0 animate-spin" />
					<span className="max-w-20 sm:max-w-30 truncate">
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
	);
}

function AddFilesButton() {
	const { data: session } = useSession();
	const {
		selectedConv,
		addConvFile,
		uploadingFile,
		setUploadingFile,
		setUploadPhase,
		setUploadError,
	} = useChatStore(
		useShallow((state) => ({
			selectedConv: state.selectedConv,
			addConvFile: state.addConvFile,
			uploadingFile: state.uploadingFile,
			setUploadingFile: state.setUploadingFile,
			setUploadPhase: state.setUploadPhase,
			setUploadError: state.setUploadError,
		})),
	);
	const { startUpload, isUploading: isUploadingToUploadThing } =
		useUploadThing("ragDocument");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isUploading = uploadingFile !== null;

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

		let attachment: Attachment | null = null;
		let conversationId: string | null = null;

		try {
			const conversation =
				selectedConv ?? (await createNewConversation(!!session?.user));
			if (!conversation) throw new Error("Could not create a conversation");
			conversationId = conversation.id;
			const signedIn = !!session?.user;
			const hash = await computeFileHash(file);

			if (signedIn) {
				const reserved = await reserveConversationFile({
					conversationId,
					hash,
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
				});

				if (reserved.reused) {
					addConvFile(conversationId, toConvFile(reserved.attachment));
					return;
				}
				attachment = reserved.attachment;
			} else {
				attachment = {
					id: "",
					indexId: createRagIndexId(conversationId),
					fileName: file.name,
					fileKey: null,
					fileUrl: null,
				};
			}

			let fileName = file.name;
			let fileKey: string | null = null;
			let fileUrl: string | null = null;

			const results = await startUpload([file]);
			const uploaded = results?.[0];
			if (!uploaded) throw new Error("File upload to UploadThing failed");

			fileKey = uploaded.key;
			fileUrl = uploaded.ufsUrl;
			fileName = uploaded.name;
			setUploadPhase("processing");

			if (signedIn && attachment.id) {
				await completeFileUpload(attachment.id, { fileKey, fileUrl });
			}

			await ingestDocument(fileUrl, fileName, attachment.indexId);

			if (signedIn && attachment.id) {
				await markFileReady(attachment.id);
			}

			addConvFile(conversationId, {
				...(attachment.id ? { attachmentId: attachment.id } : {}),
				indexId: attachment.indexId,
				fileName,
				fileUrl,
				fileKey: fileKey ?? "",
			});
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : "Upload failed, try again",
			);
			if (attachment?.id && conversationId) {
				await removeConversationFile(attachment.id, conversationId);
			}
		} finally {
			setUploadingFile(null);
		}
	};

	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				accept={RAG_ACCEPTED_EXTENSIONS.join(",")}
				className="hidden"
				onChange={handleFileSelected}
			/>

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
		</>
	);
}

export { AddFilesButton, ChatFiles };
