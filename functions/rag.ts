export const RAG_ACCEPTED_EXTENSIONS = [
	".pdf",
	".docx",
	".txt",
	".md",
	".csv",
] as const;
export const RAG_MAX_FILE_SIZE = 15 * 1024 * 1024;

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

export async function ingestDocument(
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

	const data = (await response.json().catch(() => null)) as {
		detail?: string;
		error?: string;
	} | null;

	if (!response.ok) {
		throw new Error(
			data?.detail ?? data?.error ?? `Ingestion failed (${response.status})`,
		);
	}
}

export async function deleteDocument(indexId: string): Promise<boolean> {
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

export async function deleteUploadedFile(fileKey: string): Promise<boolean> {
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

export { computeFileHash, createRagIndexId, isAcceptedRagFile, toConvFile };
