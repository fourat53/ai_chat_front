import mongoose, { model, Schema } from "mongoose";
import type { FileRecord } from "@/types/file.type";

const fileSchema = new Schema<FileRecord>(
	{
		userId: String,
		conversationIds: [String],
		indexId: String,
		hash: String,
		fileName: String,
		fileType: String,
		fileSize: Number,
		fileKey: String,
		fileUrl: String,
		status: String,
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

fileSchema.index({ userId: 1, hash: 1 }, { unique: true });

if (mongoose.models.File) {
	mongoose.deleteModel("File");
}

export const FileModel = model<FileRecord>("File", fileSchema);
