"use server";

import { deleteFileData } from "@/client/file.client";
import { getUserId } from "@/lib/auth/session";
import { FileModel } from "@/models/file.model";
import type { Attachment, UserFile } from "@/types/file.type";

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

const STALE_UPLOAD_TTL_MS = 10 * 60 * 1000;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

function isStaleUpload(createdAt: Date | undefined | null): boolean {
	return Date.now() - (createdAt?.getTime() ?? 0) > STALE_UPLOAD_TTL_MS;
}

function toAttachment(doc: {
	_id: { toString(): string };
	indexId: string;
	fileName: string;
	fileKey: string | null;
	fileUrl: string | null;
	hash?: string;
}): Attachment {
	return {
		id: doc._id.toString(),
		indexId: doc.indexId,
		fileName: doc.fileName,
		fileKey: doc.fileKey,
		fileUrl: doc.fileUrl,
		hash: doc.hash,
	};
}

function createIndexId(conversationId: string): string {
	return `${conversationId}::${crypto.randomUUID()}`;
}

async function cleanupAttachment(
	userId: string,
	attachment: Attachment,
): Promise<void> {
	await deleteFileData(attachment.indexId, attachment.fileKey);
	await FileModel.deleteOne({ _id: attachment.id, userId });
}

async function cleanupStaleUploads(
	userId: string,
	conversationId: string,
): Promise<void> {
	const stale = await FileModel.find({
		userId,
		conversationIds: conversationId,
		status: "uploading",
		createdAt: { $lt: new Date(Date.now() - STALE_UPLOAD_TTL_MS) },
	}).lean();
	await Promise.allSettled(
		stale.map((doc) => cleanupAttachment(userId, toAttachment(doc))),
	);
}

async function reserveConversationFile(
	input: ReserveFileInput,
): Promise<ReserveFileResult> {
	if (!HASH_PATTERN.test(input.hash)) throw new Error("Invalid file hash");

	const userId = await getUserId();

	for (let attempt = 0; attempt < 2; attempt++) {
		const existing = await FileModel.findOne({
			userId,
			hash: input.hash,
		}).lean();

		if (existing) {
			if (existing.status === "ready") {
				await FileModel.updateOne(
					{ _id: existing._id, userId },
					{ $addToSet: { conversationIds: input.conversationId } },
				);
				return { reused: true, attachment: toAttachment(existing) };
			}
			if (isStaleUpload(existing.createdAt)) {
				await cleanupAttachment(userId, toAttachment(existing));
			} else {
				throw new Error(
					"This file is already being added to the conversation.",
				);
			}
		}

		try {
			const created = await FileModel.create({
				userId,
				conversationIds: [input.conversationId],
				indexId: createIndexId(input.conversationId),
				hash: input.hash,
				fileName: input.fileName,
				fileType: input.fileType,
				fileSize: input.fileSize,
				fileKey: null,
				fileUrl: null,
				status: "uploading",
			});
			return { reused: false, attachment: toAttachment(created) };
		} catch (error) {
			if ((error as { code?: number }).code !== 11000) throw error;
		}
	}

	throw new Error("This file is already being added to the conversation.");
}

async function completeFileUpload(
	attachmentId: string,
	file: { fileKey: string; fileUrl: string },
): Promise<void> {
	if (!file.fileKey.trim() || !file.fileUrl.trim()) {
		throw new Error("Missing uploaded file reference");
	}
	const userId = await getUserId();

	const result = await FileModel.updateOne(
		{ _id: attachmentId, userId, status: "uploading" },
		{ $set: { fileKey: file.fileKey, fileUrl: file.fileUrl } },
	);
	if (result.matchedCount === 0) {
		throw new Error("File upload session not found");
	}
}

async function markFileReady(attachmentId: string): Promise<void> {
	const userId = await getUserId();

	const result = await FileModel.updateOne(
		{ _id: attachmentId, userId, status: "uploading" },
		{ $set: { status: "ready" } },
	);
	if (result.matchedCount === 0) {
		throw new Error("File upload session not found");
	}
}

async function getConversationFiles(
	conversationId: string,
): Promise<Attachment[]> {
	const userId = await getUserId();

	await cleanupStaleUploads(userId, conversationId);
	const docs = await FileModel.find({
		userId,
		conversationIds: conversationId,
		status: "ready",
	}).lean();
	return docs.map(toAttachment);
}

async function removeConversationFile(
	attachmentId: string,
	conversationId: string,
): Promise<{ deleted: boolean }> {
	const userId = await getUserId();

	const doc = await FileModel.findOne({ _id: attachmentId, userId }).lean();
	if (!doc) return { deleted: false };

	const remaining = doc.conversationIds.filter(
		(id: { toString: () => string }) => id.toString() !== conversationId,
	);
	if (remaining.length === 0) {
		await cleanupAttachment(userId, toAttachment(doc));
		return { deleted: true };
	}
	await FileModel.updateOne(
		{ _id: doc._id, userId, conversationIds: conversationId },
		{ $set: { conversationIds: remaining } },
	);
	return { deleted: false };
}

type UserFileDoc = {
	_id: { toString(): string };
	fileName?: string | null;
	fileType?: string | null;
	fileSize?: number | null;
	fileUrl?: string | null;
	createdAt?: Date | null;
	updatedAt?: Date | null;
};

async function getUserFiles(): Promise<UserFile[]> {
	const userId = await getUserId();

	const docs = await FileModel.find(
		{ userId, status: "ready" },
		{
			fileName: 1,
			fileType: 1,
			fileSize: 1,
			fileUrl: 1,
			createdAt: 1,
			updatedAt: 1,
		},
	)
		.sort({ updatedAt: -1 })
		.lean();

	return docs
		.filter((file: UserFileDoc) => Boolean(file.fileUrl))
		.map(
			(file: UserFileDoc): UserFile => ({
				id: file._id.toString(),
				fileName: file.fileName ?? "",
				fileType: file.fileType ?? "",
				fileSize: file.fileSize ?? 0,
				fileUrl: file.fileUrl ?? "",
				createdAt: (
					file.updatedAt ??
					file.createdAt ??
					new Date()
				).toISOString(),
			}),
		);
}

export {
	completeFileUpload,
	getConversationFiles,
	getUserFiles,
	markFileReady,
	removeConversationFile,
	reserveConversationFile,
};
