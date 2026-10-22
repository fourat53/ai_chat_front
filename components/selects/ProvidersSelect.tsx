"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { getProviders } from "@/actions/provider.action";
import Select from "@/components/selects/Select";
import { useChatStore } from "@/store/useChatStore";

export default function ProvidersSelect() {
	const { providers, setProviders, selectedProvider, setSelectedProvider } =
		useChatStore(
			useShallow((s) => ({
				providers: s.providers,
				setProviders: s.setProviders,
				selectedProvider: s.selectedProvider,
				setSelectedProvider: s.setSelectedProvider,
			})),
		);

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
			items={providers.map((provider) => ({
				value: provider.id,
				label: provider.name,
			}))}
			value={selectedProvider?.id ?? null}
			onValueChange={(id) => {
				setSelectedProvider(providers.find((p) => p.id === id) ?? null);
			}}
			placeholder="Provider"
			size="sm"
			disabled={providers.length === 0}
			triggerClassName="w-32 sm:w-40 h-7 bg-transparent border-none shadow-none text-xs hover:bg-accent focus-visible:ring-0"
			searchable
		/>
	);
}
