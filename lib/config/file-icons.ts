import {
	IconFileText,
	IconFileTypeCsv,
	IconFileTypeDocx,
	IconFileTypePdf,
	IconFileTypePpt,
	IconFileTypeTxt,
	IconMarkdown,
} from "@tabler/icons-react";

type FileTypeVisual = {
	icon: typeof IconFileText;
	color: string;
};

const FILE_TYPE_ICONS: Record<string, FileTypeVisual> = {
	".pdf": { icon: IconFileTypePdf, color: "text-red-500" },
	".docx": { icon: IconFileTypeDocx, color: "text-blue-500" },
	".pptx": { icon: IconFileTypePpt, color: "text-orange-500" },
	".txt": { icon: IconFileTypeTxt, color: "text-gray-500" },
	".md": { icon: IconMarkdown, color: "text-purple-500" },
	".csv": { icon: IconFileTypeCsv, color: "text-green-500" },
};

const DEFAULT_FILE_TYPE_VISUAL: FileTypeVisual = {
	icon: IconFileText,
	color: "text-muted-foreground",
};

function fileExtension(fileName: string): string {
	return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}

function fileTypeVisual(fileName: string): FileTypeVisual {
	return FILE_TYPE_ICONS[fileExtension(fileName)] ?? DEFAULT_FILE_TYPE_VISUAL;
}

export { fileExtension, fileTypeVisual };
