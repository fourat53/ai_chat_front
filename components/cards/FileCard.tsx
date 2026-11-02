import { cn } from "cn";
import { fileTypeVisual } from "@/lib/config/file-icons";
import type { UserFile } from "@/types/file.type";
import { Button } from "../ui/button";

function formatFileSize(size: number): string {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type FileGridItemProps = {
	file: UserFile;
	onPreview: (file: UserFile) => void;
};

export default function FileCard({ file, onPreview }: FileGridItemProps) {
	const { icon: TypeIcon, color: TypeColor } = fileTypeVisual(file.fileName);
	return (
		<Button
			variant="outline"
			className="flex-col items-start w-full h-auto gap-2 p-3 text-left border border-border bg-background dark:bg-accent hover:bg-teal-950/5 dark:hover:bg-background/20 rounded-xl"
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
