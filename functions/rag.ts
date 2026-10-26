export const RAG_ACCEPTED_EXTENSIONS = [
	".pdf",
	".docx",
	".pptx",
	".txt",
	".md",
	".csv",
] as const;
export const RAG_MAX_FILE_SIZE = 15 * 1024 * 1024;

type RagErrorResponse = {
	detail?: string;
	error?: string;
	details?: string;
};

function isAcceptedRagFile(file: File): boolean {
	const name = file.name.toLowerCase();
	return RAG_ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
}

import type { Attachment, ConvFile } from "@/types/file.type";

function toConvFile(attachment: Attachment): ConvFile {
	return {
		attachmentId: attachment.id,
		indexId: attachment.indexId,
		fileName: attachment.fileName,
		fileUrl: attachment.fileUrl ?? "",
		fileKey: attachment.fileKey ?? "",
		selected: true,
		hash: attachment.hash,
	};
}

async function computeFileHash(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const digest = await crypto.subtle.digest("SHA-256", buffer);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function createRagIndexId(conversationId: string): string {
	return `${conversationId}::${crypto.randomUUID()}`;
}

async function ingestDocument(
	fileUrl: string,
	fileName: string,
	indexId: string,
): Promise<void> {
	const response = await fetch("/api/rag/ingest", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: fileUrl,
			filename: fileName,
			index_id: indexId,
		}),
	});

	const raw = await response.text();
	let data: RagErrorResponse | null = null;
	try {
		data = JSON.parse(raw) as RagErrorResponse;
	} catch {
		data = null;
	}

	if (!response.ok) {
		console.error("RAG ingestion failed:", response.status, raw);
		throw new Error(
			data?.detail ??
				data?.error ??
				data?.details ??
				`Ingestion failed (${response.status})`,
		);
	}
}

async function deleteDocument(indexId: string): Promise<boolean> {
	try {
		const response = await fetch("/api/rag/delete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ index_id: indexId }),
		});
		return response.ok;
	} catch (error) {
		console.error("Failed to delete document vectors:", error);
		return false;
	}
}

async function deleteUploadedFile(fileKey: string): Promise<boolean> {
	try {
		const response = await fetch("/api/uploadthing/delete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ key: fileKey }),
		});
		return response.ok;
	} catch (error) {
		console.error("Failed to delete uploaded file:", error);
		return false;
	}
}

export {
	computeFileHash,
	createRagIndexId,
	isAcceptedRagFile,
	toConvFile,
	ingestDocument,
	deleteDocument,
	deleteUploadedFile,
};
