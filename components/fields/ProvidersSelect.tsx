"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getProviders } from "@/actions/provider.action";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useChatStore } from "@/store/useChatStore";

export default function ProvidersSelect() {
	const { providers, setProviders, selectedProvider, setSelectedProvider } =
		useChatStore();

	const { data, isLoading, error } = useQuery({
		queryKey: ["providers"],
		queryFn: () => getProviders(),
	});

	useEffect(() => {
		if (!data) return;
		setProviders(data);
	}, [data, setProviders]);

	useEffect(() => {
		if (providers && providers.length > 0) {
			setSelectedProvider(providers[0]);
		}
	}, [providers, setSelectedProvider]);

	if (isLoading)
		return <div className="w-40 h-7 bg-muted rounded-full animate-pulse" />;

	if (error)
		return (
			<div className="w-40 h-7 text-xs text-foreground-muted flex items-center px-2">
				Failed to load providers
			</div>
		);

	return (
		<Select
			value={selectedProvider?.id ?? ""}
			onValueChange={(val) => {
				setSelectedProvider(providers.find((p) => p.id === val) ?? null);
			}}
		>
			<SelectTrigger
				size="sm"
				className="w-32 sm:w-40 h-7 bg-transparent border-none shadow-none text-xs hover:bg-accent focus-visible:ring-0"
			>
				<SelectValue>{selectedProvider?.name}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Providers</SelectLabel>
					{providers.map((p) => (
						<SelectItem key={p.id} value={p.id}>
							{p.name}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
