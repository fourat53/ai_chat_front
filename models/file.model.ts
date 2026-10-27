import { model, models, Schema } from "mongoose";

const fileSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, required: true, index: true },
		conversationIds: [{ type: Schema.Types.ObjectId }],
		indexId: String,
		hash: String,
		fileName: String,
		fileType: String,
		fileSize: Number,
		fileKey: String,
		fileUrl: String,
		status: String,
	},
	{ timestamps: true },
);

export const FileModel = models.File || model("File", fileSchema);
