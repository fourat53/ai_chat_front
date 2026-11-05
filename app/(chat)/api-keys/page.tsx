"use client";

import { IconKey } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getSavedApiKeys } from "@/actions/api-key.action";
import ApiKeyCard from "@/components/cards/ApiKeyCard";
import MainLoader from "@/components/loaders/MainLoader";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useRequireSession } from "@/hooks/use-require-session";
import { PROVIDERS } from "@/types/provider.type";

export default function ApiKeysPage() {
	const signedIn = useRequireSession();
	const keysQuery = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => getSavedApiKeys(),
		enabled: signedIn,
	});

	const savedKeysByProviderId = new Map(
		(keysQuery.data ?? []).map((key) => [key.providerId, key]),
	);

	if (!signedIn) return <MainLoader />;

	return (
		<div className="h-[calc(100svh-60px)] overflow-y-auto w-full p-5 space-y-5">
			<Card className="p-4">
				<CardHeader>
					<CardTitle className="flex items-center gap-1.5 text-lg">
						<IconKey className="size-5" />
						API keys
					</CardTitle>
					<CardDescription>
						Store a personal API key per provider to use it instead of the
						default server keys. Keys are encrypted before storage and are never
						returned as plain text.
					</CardDescription>
				</CardHeader>
			</Card>
			<div className="grid lg:grid-cols-2 gap-5">
				{keysQuery.error ? (
					<p className="text-xs text-destructive">
						Failed to load your saved keys. Try to refresh.
					</p>
				) : (
					PROVIDERS.map((p) => (
						<ApiKeyCard
							key={p.id}
							provider={p}
							status={
								keysQuery.isPending
									? undefined
									: (savedKeysByProviderId.get(p.id) ?? null)
							}
						/>
					))
				)}
			</div>
		</div>
	);
}
