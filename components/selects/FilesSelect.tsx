"use client";

import {
	IconCheck,
	IconEye,
	IconFileText,
	IconFileTypeCsv,
	IconFileTypeDocx,
	IconFileTypePdf,
	IconFileTypeTxt,
	IconFiles,
	IconMarkdown,
	IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { removeConversationFile } from "@/actions/file.action";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileViewer } from "@/components/ui/doc-viewer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDocument, deleteUploadedFile } from "@/functions/rag";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { ConvFile } from "@/types/file.type";

const FILE_TYPE_ICONS: Record<
	string,
	{ icon: typeof IconFileText; color: string }
> = {
	".pdf": { icon: IconFileTypePdf, color: "text-red-500" },
	".docx": { icon: IconFileTypeDocx, color: "text-blue-500" },
	".txt": { icon: IconFileTypeTxt, color: "text-gray-500" },
	".md": { icon: IconMarkdown, color: "text-purple-500" },
	".csv": { icon: IconFileTypeCsv, color: "text-green-500" },
};

function fileTypeIcon(fileName: string) {
	const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
	return FILE_TYPE_ICONS[extension] ?? IconFileText;
}

export default function FilesSelect() {
	const {
		selectedConv,
		convFiles,
		removeConvFile,
		addConvFile,
		toggleConvFileSelected,
		setUploadError,
	} = useChatStore(
		useShallow((state) => ({
			selectedConv: state.selectedConv,
			convFiles: state.convFiles,
			removeConvFile: state.removeConvFile,
			addConvFile: state.addConvFile,
			toggleConvFileSelected: state.toggleConvFileSelected,
			setUploadError: state.setUploadError,
		})),
	);
	const [menuOpen, setMenuOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState<ConvFile | null>(null);

	const rawFiles: ConvFile[] = selectedConv
		? (convFiles[selectedConv.id] ?? [])
		: [];
	const ragFiles = rawFiles.filter(
		(file, index, self) =>
			index === self.findIndex((f) => f.indexId === file.indexId),
	);
	const selectedCount = ragFiles.filter((file) => file.selected).length;

	const handleRemoveFile = async (ragFile: ConvFile) => {
		const conversationId = selectedConv?.id;
		if (conversationId) {
			removeConvFile(conversationId, ragFile.indexId);
		}

		if (ragFile.attachmentId && conversationId) {
			try {
				const result = await removeConversationFile(
					ragFile.attachmentId,
					conversationId,
				);
				if (result?.deleted) {
					void deleteDocument(ragFile.indexId);
					void deleteUploadedFile(ragFile.fileKey);
				}
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

	if (ragFiles.length === 0) return null;

	return (
		<>
			<div className="mx-px w-px h-4 bg-border" />

			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" className="h-9 text-xs font-normal" />
					}
				>
					<IconFiles className="text-muted-foreground" />
					{selectedCount}/{ragFiles.length} files
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side="top"
					align="start"
					className="w-80 p-1.5 shadow-xl border-border/60 backdrop-blur-md"
				>
					<DropdownMenuGroup>
						<DropdownMenuLabel className="mb-1.5 text-xs text-muted-foreground px-2 py-1.5 font-medium flex items-center justify-between">
							<span>Files included in model context</span>
							<span className="text-[10px] text-muted-foreground/70 font-normal">
								{selectedCount} selected
							</span>
						</DropdownMenuLabel>
						<div className="max-h-60 overflow-y-auto space-y-0.5">
							{ragFiles.map((ragFile) => {
								const { icon: TypeIcon, color: TypeColor } = fileTypeIcon(
									ragFile.fileName,
								);
								return (
									<DropdownMenuItem
										key={ragFile.indexId}
										closeOnClick={false}
										onClick={() => {
											if (selectedConv) {
												toggleConvFileSelected(
													selectedConv.id,
													ragFile.indexId,
												);
											}
										}}
										className="group/file-item flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-accent/60 transition-colors"
									>
										<span
											className={cn(
												"flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
												ragFile.selected
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted-foreground/40 bg-background/50 group-hover/file-item:border-muted-foreground/70",
											)}
										>
											{ragFile.selected && (
												<IconCheck size={11} strokeWidth={3} />
											)}
										</span>
										<TypeIcon size={15} className={cn("shrink-0", TypeColor)} />
										<span
											title={ragFile.fileName}
											className={cn(
												"min-w-0 flex-1 truncate text-xs transition-colors",
												ragFile.selected
													? "text-foreground font-medium"
													: "text-muted-foreground",
											)}
										>
											{ragFile.fileName}
										</span>
										<div className="flex items-center gap-0.5 opacity-80 group-hover/file-item:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="icon"
												type="button"
												title="Preview file"
												className="size-6 rounded-md hover:bg-sidebar hover:text-foreground text-muted-foreground"
												onClick={(event) => {
													event.stopPropagation();
													setMenuOpen(false);
													setPreviewFile(ragFile);
												}}
												onKeyDown={(event) => event.stopPropagation()}
											>
												<IconEye size={13} />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												type="button"
												title="Remove file"
												className="size-6 rounded-md hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
												onClick={(event) => {
													event.stopPropagation();
													void handleRemoveFile(ragFile);
												}}
												onKeyDown={(event) => event.stopPropagation()}
											>
												<IconX size={13} />
											</Button>
										</div>
									</DropdownMenuItem>
								);
							})}
						</div>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog
				open={previewFile !== null}
				onOpenChange={(open) => {
					if (!open) setPreviewFile(null);
				}}
			>
				{previewFile && (
					<DialogContent className="sm:max-w-3xl">
						<DialogHeader>
							<DialogTitle>{previewFile.fileName}</DialogTitle>
						</DialogHeader>
						{previewFile.fileUrl ? (
							<FileViewer file={previewFile.fileUrl} />
						) : (
							<p className="text-sm text-muted-foreground">
								Preview is not available for this file.
							</p>
						)}
					</DialogContent>
				)}
			</Dialog>
		</>
	);
}
