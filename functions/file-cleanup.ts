import { UTApi } from "uploadthing/server";

const RAG_URL = process.env.RAG_URL;

async function deleteFileChunks(indexId: string): Promise<void> {
	try {
		const response = await fetch(`${RAG_URL}/rag/delete`, {
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

export { deleteFileData };
