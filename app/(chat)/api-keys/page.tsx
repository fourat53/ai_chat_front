"use client";

import { IconEye, IconEyeOff, IconKey, IconTrash } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	deleteApiKey,
	getSavedApiKeys,
	saveApiKey,
} from "@/actions/api-key.action";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth/auth-client";
import type { ApiKeyStatus } from "@/types/api-key.type";
import { PROVIDERS, type Provider } from "@/types/provider.type";

type ProviderKeyRowProps = {
	provider: Provider;
	status: ApiKeyStatus | null | undefined;
};

function ProviderKeyRow({ provider, status }: ProviderKeyRowProps) {
	const queryClient = useQueryClient();
	const [value, setValue] = useState("");
	const [visible, setVisible] = useState(false);
	const [pending, setPending] = useState<"save" | "remove" | null>(null);

	const key = value.trim();

	const refreshSavedKeys = () =>
		queryClient.invalidateQueries({ queryKey: ["api-keys"] });

	const handleSave = async () => {
		if (!key || pending) return;
		setPending("save");
		try {
			await saveApiKey({ providerId: provider.id, key });
			setValue("");
			setVisible(false);
			toast.success(`${provider.name} API key saved.`);
			await refreshSavedKeys();
		} catch (error) {
			console.error("Failed to save API key:", error);
			toast.error(`Failed to save the ${provider.name} API key. Try again.`);
		} finally {
			setPending(null);
		}
	};

	const handleRemove = async () => {
		if (pending) return;
		setPending("remove");
		try {
			await deleteApiKey(provider.id);
			setValue("");
			setVisible(false);
			toast.success(`${provider.name} will now use the default server key.`);
			await refreshSavedKeys();
		} catch (error) {
			console.error("Failed to remove API key:", error);
			toast.error(`Failed to remove the ${provider.name} API key. Try again.`);
		} finally {
			setPending(null);
		}
	};

	return (
		<Field className="rounded-xl border p-3.5 gap-2.5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FieldLabel className="text-sm">{provider.name}</FieldLabel>
				{status === undefined ? (
					<span className="text-xs animate-pulse text-muted-foreground">
						Checking saved key…
					</span>
				) : status ? (
					<span className="text-xs text-muted-foreground">
						Your key is active{" "}
						<span className="font-mono">••••{status.preview}</span> · saved{" "}
						{new Date(status.updatedAt).toLocaleDateString()}
					</span>
				) : (
					<span className="text-xs text-muted-foreground">
						Using the default server key
					</span>
				)}
			</div>
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Input
						type={visible ? "text" : "password"}
						placeholder={`Enter your ${provider.name} API key`}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						autoComplete="off"
						spellCheck={false}
						className="h-8 text-xs rounded-lg pr-9"
					/>
					<button
						type="button"
						aria-label={visible ? "Hide API key" : "Show API key"}
						onClick={() => setVisible((state) => !state)}
						className="absolute -translate-y-1/2 cursor-pointer right-3 top-1/2 text-muted-foreground hover:text-foreground"
					>
						{visible ? (
							<IconEyeOff className="size-4" />
						) : (
							<IconEye className="size-4" />
						)}
					</button>
				</div>
				<Button
					variant="secondary"
					size="sm"
					loading={pending === "save"}
					disabled={!key || pending === "remove"}
					onClick={() => void handleSave()}
				>
					Save
				</Button>
				{status && (
					<Button
						variant="ghost"
						size="icon-sm"
						icon={<IconTrash />}
						aria-label={`Remove the saved ${provider.name} API key`}
						title="Remove the saved key and go back to the default server key"
						loading={pending === "remove"}
						onClick={() => void handleRemove()}
					/>
				)}
			</div>
		</Field>
	);
}

export default function ApiKeysPage() {
	const { data: session } = useSession();
	const keysQuery = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => getSavedApiKeys(),
		enabled: !!session?.user,
	});

	const savedKeysByProviderId = new Map(
		(keysQuery.data ?? []).map((key) => [key.providerId, key]),
	);

	return (
		<div className="flex items-center justify-center h-full">
			<div className="w-full max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<IconKey className="size-5" />
							API keys
						</CardTitle>
						<CardDescription>
							Store a personal API key per provider to use it instead of the
							default server keys. Keys are encrypted before storage and are
							never returned as plain text.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						{keysQuery.error && (
							<p className="text-xs text-destructive">
								Failed to load your saved keys. Try to refresh.
							</p>
						)}

						{PROVIDERS.map((p) => (
							<ProviderKeyRow
								key={p.id}
								provider={p}
								status={
									keysQuery.isPending && session?.user
										? undefined
										: (savedKeysByProviderId.get(p.id) ?? null)
								}
							/>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
