import { UTApi } from "uploadthing/server";
import {
	type Attachment,
	type ConvFile,
	FILE_EXTENSIONS,
} from "@/types/file.type";

type RagErrorResponse = {
	detail?: string;
	error?: string;
	details?: string;
};

function isAcceptedRagFile(file: File): boolean {
	const name = file.name.toLowerCase();
	return FILE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

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

async function deleteFileChunks(indexId: string): Promise<void> {
	try {
		const response = await fetch(`${process.env.RAG_URL}/rag/delete`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ index_id: indexId }),
		});
		if (!response.ok) {
			console.error(
				"RAG delete error:",
				response.status,
				await response.text(),
			);
		}
	} catch (error) {
		console.error("Failed to delete indexed chunks:", error);
	}
}

async function deleteUploadThingBlob(fileKey: string): Promise<void> {
	try {
		await new UTApi().deleteFiles(fileKey, { keyType: "fileKey" });
	} catch (error) {
		console.error("Failed to delete uploaded file:", error);
	}
}

async function deleteFileData(
	indexId: string,
	fileKey: string | null,
): Promise<void> {
	await deleteFileChunks(indexId);
	if (fileKey) {
		await deleteUploadThingBlob(fileKey);
	}
}

export {
	computeFileHash,
	createRagIndexId,
	deleteDocument,
	deleteFileData,
	deleteUploadedFile,
	ingestDocument,
	isAcceptedRagFile,
	toConvFile,
};
