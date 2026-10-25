type ConvFile = {
	attachmentId?: string;
	indexId: string;
	fileName: string;
	fileUrl: string;
	fileKey: string;
};

type FileStatus = "uploading" | "ready";

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
	FileStatus,
	ReserveFileInput,
	ReserveFileResult,
};
