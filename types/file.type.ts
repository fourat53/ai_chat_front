import { z } from "zod";

enum FileStatus {
	uploading = "uploading",
	ready = "ready",
}

const FILE_STATUS = ["uploading", "ready"] as const;

enum FileType {
	".pdf" = "PDF",
	".docx" = "DOCX",
	".pptx" = "PPTX",
	".txt" = "TXT",
	".md" = "MD",
	".csv" = "CSV",
}

const FILE_EXTENSIONS = [
	".pdf",
	".docx",
	".pptx",
	".txt",
	".md",
	".csv",
] as const;

const FILE_MAX_SIZE = 15 * 1024 * 1024;

const file = z.object({
	id: z.string(),
	attachmentId: z.string().optional(),
	indexId: z.string(),
	fileName: z.string(),
	fileSize: z.string(),
	fileType: z.enum(FILE_EXTENSIONS),
	fileUrl: z.string(),
	fileKey: z.string(),
	selected: z.boolean(),
	hash: z.string().optional(),
	status: z.enum(FILE_STATUS),
});

type File = z.infer<typeof file>;
type FileBody = Omit<File, "id">;

type ConvFile = {
	attachmentId?: string;
	indexId: string;
	fileName: string;
	fileUrl: string;
	fileKey: string;
	selected: boolean;
	hash?: string;
};

type FileRecord = {
	userId: string;
	conversationIds: string[];
	indexId: string;
	hash: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	fileKey: string | null;
	fileUrl: string | null;
	status: FileStatus;
	createdAt?: Date;
};

type Attachment = {
	id: string;
	indexId: string;
	fileName: string;
	fileKey: string | null;
	fileUrl: string | null;
	hash?: string;
};

type ReserveFileInput = {
	conversationId: string;
	hash: string;
	fileName: string;
	fileType: string;
	fileSize: number;
};

type ReserveFileResult = {
	reused: boolean;
	attachment: Attachment;
};

export type {
	Attachment,
	ConvFile,
	FileRecord,
	ReserveFileInput,
	ReserveFileResult,
};
export {
	FILE_EXTENSIONS,
	FILE_MAX_SIZE,
	FILE_STATUS,
	type File,
	type FileBody,
	FileStatus,
	FileType,
	file,
};
