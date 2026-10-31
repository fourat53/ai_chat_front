"use client";

import {
	IconBooks,
	IconFileText,
	IconSearch,
	IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getUserFiles } from "@/actions/file.action";
import MainLoader from "@/components/loaders/MainLoader";
import Select from "@/components/selects/Select";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileViewer } from "@/components/ui/doc-viewer";
import { Input } from "@/components/ui/input";
import { useRequireSession } from "@/hooks/use-require-session";
import { fileExtension, fileTypeVisual } from "@/lib/config/file-icons";
import { cn } from "@/lib/utils";
import type { UserFile } from "@/types/file.type";

const ALL_TYPES = "all";

function formatFileSize(size: number): string {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTypeItems(extensions: string[]) {
	return [
		{ value: ALL_TYPES, label: "All types" },
		...extensions.map((extension) => ({
			value: extension,
			label: `${extension.slice(1).toUpperCase()} (.${extension.slice(1)})`,
		})),
	];
}

type FileGridItemProps = {
	file: UserFile;
	onPreview: (file: UserFile) => void;
};

function FileGridItem({ file, onPreview }: FileGridItemProps) {
	const { icon: TypeIcon, color: TypeColor } = fileTypeVisual(file.fileName);

	return (
		<Button
			variant="outline"
			className="flex-col items-start w-full h-auto gap-2 p-3 text-left rounded-xl"
			onClick={() => onPreview(file)}
		>
			<div className="flex items-center w-full min-w-0 gap-2">
				<TypeIcon className={cn("size-5 shrink-0", TypeColor)} />
				<span
					title={file.fileName}
					className="flex-1 text-sm font-medium truncate"
				>
					{file.fileName}
				</span>
			</div>
			<div className="w-full text-xs truncate text-muted-foreground">
				{formatFileSize(file.fileSize)} ·{" "}
				{new Date(file.createdAt).toLocaleDateString()}
			</div>
		</Button>
	);
}

export default function LibraryPage() {
	const signedIn = useRequireSession();
	const filesQuery = useQuery({
		queryKey: ["library-files"],
		queryFn: () => getUserFiles(),
		enabled: signedIn,
	});

	const [nameFilter, setNameFilter] = useState("");
	const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
	const [previewFile, setPreviewFile] = useState<UserFile | null>(null);

	const files = filesQuery.data;

	const typeItems = useMemo(() => {
		const extensions = [
			...new Set((files ?? []).map((file) => fileExtension(file.fileName))),
		].sort();
		return buildTypeItems(extensions);
	}, [files]);

	const filteredFiles = useMemo(() => {
		const query = nameFilter.trim().toLowerCase();
		const extension = typeFilter === ALL_TYPES ? "" : typeFilter.toLowerCase();
		return (files ?? []).filter((file) => {
			const normalizedName = file.fileName.toLowerCase();
			return (
				(!query || normalizedName.includes(query)) &&
				(!extension || normalizedName.endsWith(extension))
			);
		});
	}, [files, nameFilter, typeFilter]);

	if (!signedIn) return <MainLoader />;

	return (
		<div className="h-full p-5">
			<Card className="h-full rounded-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<IconBooks className="size-5" />
						Files library
					</CardTitle>
					<CardDescription>
						Files you attached to your conversations. Click a file to preview
						it.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<div className="relative flex-1 min-w-48">
							<Input
								placeholder="Filter by name"
								value={nameFilter}
								onChange={(event) => setNameFilter(event.target.value)}
								className="pr-9"
							/>
							{nameFilter ? (
								<Button
									variant="ghost"
									size="icon-sm"
									icon={<IconX />}
									aria-label="Clear name filter"
									className="absolute -translate-y-1/2 right-1.5 top-1/2"
									onClick={() => setNameFilter("")}
								/>
							) : (
								<IconSearch className="absolute -translate-y-1/2 pointer-events-none size-4 right-3 top-1/2 text-muted-foreground" />
							)}
						</div>
						<Select
							items={typeItems}
							value={typeFilter}
							onValueChange={(value) => setTypeFilter(value ?? ALL_TYPES)}
							placeholder="All types"
							triggerClassName="w-40"
						/>
					</div>

					{filesQuery.error && (
						<p className="text-xs text-destructive">
							Failed to load your files. Try to refresh.
						</p>
					)}

					{filesQuery.isPending ? (
						<MainLoader />
					) : (files ?? []).length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
							<IconFileText className="size-8" />
							<p className="text-sm">
								No files yet. Files you add to conversations appear here.
							</p>
						</div>
					) : filteredFiles.length === 0 ? (
						<p className="py-6 text-sm text-center text-muted-foreground">
							No files match your filters.
						</p>
					) : (
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
							{filteredFiles.map((file) => (
								<FileGridItem
									key={file.id}
									file={file}
									onPreview={setPreviewFile}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={previewFile !== null}
				onOpenChange={(open) => {
					if (!open) setPreviewFile(null);
				}}
			>
				{previewFile && (
					<DialogContent className="sm:max-w-3xl">
						<DialogHeader>
							<DialogTitle className="truncate">
								{previewFile.fileName}
							</DialogTitle>
						</DialogHeader>
						<FileViewer file={previewFile.fileUrl} />
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}
