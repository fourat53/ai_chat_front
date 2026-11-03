"use client";

import { IconPaperclip } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import type { ClientUploadedFileData } from "uploadthing/types";
import {
	completeFileUpload,
	markFileReady,
	removeConversationFile,
	reserveConversationFile,
} from "@/actions/file.action";
import { createNewConversation } from "@/client/conversation.client";
import {
	computeFileHash,
	createRagIndexId,
	ingestDocument,
	isAcceptedRagFile,
	toConvFile,
	trackIngest,
} from "@/client/file.client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { useUploadThing } from "@/lib/config/uploadthing";
import { useChatStore } from "@/store/useChatStore";
import {
	type Attachment,
	type ConvFile,
	FILE_EXTENSIONS,
	FILE_MAX_SIZE,
} from "@/types/file.type";

type UploadedAsset = ClientUploadedFileData<unknown>;

type StartUploadFn = (files: File[]) => Promise<UploadedAsset[] | undefined>;

type FilePipelineContext = {
	file: File;
	conversationId: string;
	signedIn: boolean;
	startUpload: StartUploadFn;
};

function filterUploadableFiles(fileList: FileList | null): File[] {
	return Array.from(fileList ?? []).filter((file) => {
		if (!isAcceptedRagFile(file)) {
			toast.error(
				`Unsupported file type. Allowed: ${FILE_EXTENSIONS.join(", ")}`,
			);
			return false;
		}
		if (file.size === 0) {
			toast.error("The selected file is empty.");
			return false;
		}
		if (file.size > FILE_MAX_SIZE) {
			toast.error("File exceeds the 15 MB size limit.");
			return false;
		}
		return true;
	});
}

function createPendingFile(
	attachment: Attachment,
	file: File,
	hash: string,
): ConvFile {
	return {
		...(attachment.id ? { attachmentId: attachment.id } : {}),
		indexId: attachment.indexId,
		fileName: file.name,
		fileUrl: "",
		fileKey: "",
		selected: true,
		hash,
		pending: true,
	};
}

async function processFile({
	file,
	conversationId,
	signedIn,
	startUpload,
}: FilePipelineContext) {
	let attachment: Attachment | null = null;
	try {
		const hash = await computeFileHash(file);
		const { addConvFile, toggleConvFileSelected, convFiles } =
			useChatStore.getState();
		const alreadyAdded = (convFiles[conversationId] ?? []).find(
			(f) =>
				(f.hash && f.hash === hash) || (f.fileName === file.name && f.fileUrl),
		);
		if (alreadyAdded) {
			if (!alreadyAdded.selected) {
				toggleConvFileSelected(conversationId, alreadyAdded.indexId);
			}
			toast.info("This file is already added to the conversation.");
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
				toast.info(
					"This file is already in your library and was added to the conversation.",
				);
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

		const indexId = attachment.indexId;
		const attachmentId = attachment.id;
		const pendingFile = createPendingFile(attachment, file, hash);
		addConvFile(conversationId, pendingFile);

		const fileName = await trackIngest(indexId, async () => {
			const uploaded = (await startUpload([file]))?.[0];
			if (!uploaded) throw new Error("File upload to UploadThing failed");

			if (signedIn && attachmentId) {
				await completeFileUpload(attachmentId, {
					fileKey: uploaded.key,
					fileUrl: uploaded.ufsUrl,
				});
			}
			await ingestDocument(uploaded.ufsUrl, uploaded.name, indexId);
			if (signedIn && attachmentId) {
				await markFileReady(attachmentId);
			}

			useChatStore.getState().addConvFile(conversationId, {
				...pendingFile,
				fileName: uploaded.name,
				fileUrl: uploaded.ufsUrl,
				fileKey: uploaded.key,
				pending: false,
			});
			return uploaded.name;
		});
		toast.success(`${fileName} added to the conversation.`);
	} catch (error) {
		if (attachment) {
			useChatStore
				.getState()
				.removeConvFile(conversationId, attachment.indexId);
		}
		toast.error(
			error instanceof Error ? error.message : "Upload failed. Try again.",
		);
		if (attachment?.id) {
			try {
				await removeConversationFile(attachment.id, conversationId);
			} catch (cleanupError) {
				console.error("Failed to roll back file upload:", cleanupError);
			}
		}
	}
}

export default function FilesButton() {
	const router = useRouter();
	const { data: session } = useSession();
	const selectedConv = useChatStore((state) => state.selectedConv);
	const { startUpload } = useUploadThing("ragDocument");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFilesSelected = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = filterUploadableFiles(e.target.files);
		e.target.value = "";
		if (!files.length) return;

		const conversation =
			selectedConv ?? (await createNewConversation(!!session?.user));
		if (!conversation) return;
		if (!selectedConv) {
			router.replace(`/${conversation.id}`);
		}
		const signedIn = !!session?.user;

		for (const file of files) {
			void processFile({
				file,
				conversationId: conversation.id,
				signedIn,
				startUpload,
			});
		}
	};

	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				accept={FILE_EXTENSIONS.join(",")}
				multiple
				className="hidden"
				onChange={handleFilesSelected}
			/>
			<Button
				variant="ghost"
				size="icon"
				type="button"
				className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
				onClick={() => fileInputRef.current?.click()}
			>
				<IconPaperclip size={20} />
			</Button>
		</>
	);
}
