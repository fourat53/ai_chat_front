import { model, models, Schema } from "mongoose";
import type { User } from "@/types/user.type";

const userSchema = new Schema<User>(
	{
		name: String,
		email: {
			type: String,
			unique: true,
		},
		emailVerified: Boolean,
		image: String,
	},
	{ timestamps: true },
);

export const UserModel = models.User || model("User", userSchema);
