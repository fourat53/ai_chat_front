import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/config/db";

async function getUserId(): Promise<string> {
	let userId: string | null;

	try {
		const session = await auth.api.getSession({ headers: await headers() });
		userId = session?.user?.id ?? null;
	} catch {
		throw new Error("Unauthorized");
	}

	if (!userId) throw new Error("Unauthorized");
	await connectDB();
	return userId;
}

async function getUserIdOrNull(): Promise<string | null> {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		return session?.user?.id ?? null;
	} catch {
		return null;
	}
}

export { getUserId, getUserIdOrNull };
