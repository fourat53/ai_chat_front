"use client";

import { IconCheck, IconEye, IconFileText, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { removeConversationFile } from "@/actions/file.action";
import { deleteDocument, deleteUploadedFile } from "@/client/file.client";
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
import { fileTypeVisual } from "@/lib/config/file-icons";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { ConvFile } from "@/types/file.type";

export default function FilesSelect() {
	const {
		selectedConv,
		convFiles,
		removeConvFile,
		addConvFile,
		toggleConvFileSelected,
	} = useChatStore(
		useShallow((state) => ({
			selectedConv: state.selectedConv,
			convFiles: state.convFiles,
			removeConvFile: state.removeConvFile,
			addConvFile: state.addConvFile,
			toggleConvFileSelected: state.toggleConvFileSelected,
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
				toast.error("Failed to remove the file. Try again.");
				return;
			}
			toast.success("File removed from the conversation.");
			return;
		}

		void deleteDocument(ragFile.indexId);
		void deleteUploadedFile(ragFile.fileKey);
		toast.success("File removed from the conversation.");
	};

	if (ragFiles.length === 0) return null;

	return (
		<>
			<div className="w-px h-4 mx-px max-sm:hidden bg-border" />

			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							icon={<IconFileText className="text-muted-foreground" />}
							className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
						/>
					}
				/>
				<DropdownMenuContent
					side="top"
					align="center"
					className="p-2 shadow-xl w-66 border-border/60 backdrop-blur-md"
				>
					<DropdownMenuGroup>
						<DropdownMenuLabel className="mb-1.5 px-2 py-1.5 text-center text-xs text-muted-foreground font-medium">
							Files included in model context
						</DropdownMenuLabel>
						<div className="max-h-60 overflow-y-auto space-y-0.5">
							{ragFiles.map((ragFile) => {
								const { icon: TypeIcon, color: TypeColor } = fileTypeVisual(
									ragFile.fileName,
								);
								return (
									<DropdownMenuItem
										key={ragFile.indexId}
										closeOnClick={false}
										className="group/file-item flex items-center gap-1 pl-1.75 pr-1 py-1 rounded-lg cursor-pointer hover:bg-accent/60 transition-colors"
										onClick={() => {
											if (selectedConv) {
												toggleConvFileSelected(
													selectedConv.id,
													ragFile.indexId,
												);
											}
										}}
									>
										<span
											className={cn(
												"mr-0.5 p-px flex size-3.75 shrink-0 items-center justify-center rounded border transition-colors",
												ragFile.selected
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted-foreground/40 bg-background/50 group-hover/file-item:border-muted-foreground/70",
											)}
										>
											{ragFile.selected && <IconCheck strokeWidth={3} />}
										</span>
										<TypeIcon size={15} className={`shrink-0 ${TypeColor}`} />
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
										<div className="flex items-center gap-px transition-opacity opacity-80 group-hover/file-item:opacity-100">
											<Button
												variant="ghost"
												size="icon"
												type="button"
												title="Preview file"
												className="rounded-md size-6 hover:bg-sidebar hover:text-primary text-muted-foreground"
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
												className="rounded-md size-6 hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
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
