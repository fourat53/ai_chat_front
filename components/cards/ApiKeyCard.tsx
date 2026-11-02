"use client";

import { IconEye, IconEyeOff, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteApiKey, saveApiKey } from "@/actions/api-key.action";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ApiKeyStatus } from "@/types/api-key.type";
import type { Provider } from "@/types/provider.type";
import { Card } from "../ui/card";
import { clsx } from "clsx";

type ApiKeyCardProps = {
	provider: Provider;
	status: ApiKeyStatus | null | undefined;
};

export default function ApiKeyCard({ provider, status }: ApiKeyCardProps) {
	const queryClient = useQueryClient();
	const [value, setValue] = useState("");
	const [visible, setVisible] = useState(false);
	const [pending, setPending] = useState<"save" | "remove" | null>(null);

	const refreshSavedKeys = () =>
		queryClient.invalidateQueries({ queryKey: ["api-keys"] });

	const handleSave = async () => {
		if (!value || pending) return;
		setPending("save");
		try {
			await saveApiKey({ providerId: provider.id, key: value });
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
		<Card className="rounded-xl border p-3.5 gap-2.5">
			<Field className="flex flex-wrap items-center justify-between gap-2">
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
			</Field>
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Input
						type={visible ? "text" : "password"}
						placeholder={`Enter your ${provider.name} API key`}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						autoComplete="off"
						spellCheck={false}
						className={clsx(
							"bg-background dark:bg-accent h-8 text-xs",
							status ? "pr-15" : "pr-9",
						)}
					/>

					{status && (
						<button
							type="button"
							aria-label={`Remove the saved ${provider.name} API key`}
							title="Remove the saved key and go back to the default server key"
							className="absolute -translate-y-1/2 cursor-pointer right-7.5 top-1/2 text-muted-foreground hover:text-white hover:bg-red-400 dark:hover:bg-red-900 p-1.25 rounded-full transition-colors"
							onClick={() => void handleRemove()}
						>
							<IconTrash className="size-4" />
						</button>
					)}

					<button
						type="button"
						aria-label={visible ? "Hide API key" : "Show API key"}
						onClick={() => setVisible((state) => !state)}
						className="p-1.25 rounded-full hover:bg-sidebar absolute -translate-y-1/2 cursor-pointer right-1 top-1/2 text-muted-foreground hover:text-foreground"
					>
						{visible ? (
							<IconEyeOff className="size-4" />
						) : (
							<IconEye className="size-4" />
						)}
					</button>
				</div>
				<Button
					variant="default"
					size="sm"
					loading={pending === "save"}
					disabled={!value || pending === "remove"}
					onClick={() => void handleSave()}
				>
					Save
				</Button>
			</div>
		</Card>
	);
}
