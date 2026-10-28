import { z } from "zod";

const FILE_EXTENSIONS = [
	".pdf",
	".docx",
	".pptx",
	".txt",
	".md",
	".csv",
] as const;

const FILE_STATUS = ["uploading", "ready"] as const;

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

type ConvFile = Omit<FileBody, "fileSize" | "fileType" | "status">;

type Attachment = Pick<File, "id"|"indexId" | "fileName" | "hash"> & {
	fileKey: string | null;
	fileUrl: string | null;
};

export {
	type Attachment,
	type ConvFile,
	FILE_EXTENSIONS,
	FILE_MAX_SIZE,
	FILE_STATUS,
	type FileBody,
	file,
};
