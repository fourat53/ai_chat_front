"use client";

import { IconLoader2, IconPaperclip, IconX } from "@tabler/icons-react";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	completeFileUpload,
	markFileReady,
	removeConversationFile,
	reserveConversationFile,
} from "@/actions/file.action";
import FilesSelect from "@/components/selects/FilesSelect";
import { Button } from "@/components/ui/button";
import { createNewConversation } from "@/functions/conversation";
import {
	computeFileHash,
	createRagIndexId,
	ingestDocument,
	isAcceptedRagFile,
	RAG_ACCEPTED_EXTENSIONS,
	RAG_MAX_FILE_SIZE,
	toConvFile,
} from "@/functions/rag";
import { useSession } from "@/lib/auth-client";
import { useUploadThing } from "@/lib/uploadthing";
import { useChatStore } from "@/store/useChatStore";
import type { Attachment } from "@/types/file.type";

export default function FilesButton() {
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

			const currentFiles =
				useChatStore.getState().convFiles[conversationId] ?? [];
			const alreadyAdded = currentFiles.find(
				(f) =>
					(f.hash && f.hash === hash) ||
					(f.fileName === file.name && f.fileUrl),
			);
			if (alreadyAdded) {
				if (!alreadyAdded.selected) {
					useChatStore
						.getState()
						.toggleConvFileSelected(conversationId, alreadyAdded.indexId);
				}
				return;
			}

			if (signedIn) {
				const reserved = await reserveConversationFile({
					conversationId,
					hash,
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
				});

				if (reserved.reused) {
					addConvFile(conversationId, {
						...toConvFile(reserved.attachment),
						hash,
					});
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
				selected: true,
				hash,
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
