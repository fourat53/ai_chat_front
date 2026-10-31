"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";

export function useRequireSession(): boolean {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const signedIn = Boolean(session?.user);

	useEffect(() => {
		if (!isPending && !signedIn) {
			router.replace("/login");
		}
	}, [isPending, router, signedIn]);

	return signedIn;
}
