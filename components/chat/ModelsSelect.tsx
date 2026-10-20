"use client";

import { IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type { Model } from "@/types/model.type";

function SearchField({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const frame = requestAnimationFrame(() => ref.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<div className="relative z-20 flex gap-2 items-center px-3 py-2 border-b border-border/60 bg-popover">
			<IconSearch
				size={14}
				className="pointer-events-none shrink-0 text-muted-foreground"
			/>
			<input
				ref={ref}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key.length === 1) event.stopPropagation();
				}}
				placeholder="Search models..."
				className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}

export default function ModelsSelect() {
	const {
		models,
		setModels,
		selectedModel,
		setSelectedModel,
		selectedProvider,
	} = useChatStore();

	const [search, setSearch] = useState("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["models", selectedProvider],
		refetchInterval: 60_000,
		queryFn: async () => {
			if (!selectedProvider) return [];
			const params = new URLSearchParams({
				providerId: selectedProvider.label,
				baseUrl: selectedProvider.baseUrl,
			});
			const response = await fetch(`/api/llm/models?${params.toString()}`);
			const data = await response.json();
			return data.models as Model[];
		},
		enabled: !!selectedProvider,
	});

	useEffect(() => {
		if (!data || !selectedProvider) return;
		setModels(data);
	}, [data, setModels, selectedProvider]);

	useEffect(() => {
		if (models.length === 0) {
			setSelectedModel(null);
			return;
		}

		const currentModelExists = models.some(
			(model) => model.id === selectedModel?.id,
		);

		if (!currentModelExists) {
			setSelectedModel(models[0]);
		}
	}, [models, selectedModel, setSelectedModel]);

	const filteredModels = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return models;
		return models.filter(
			(model) =>
				model.name.toLowerCase().includes(query) ||
				model.id.toLowerCase().includes(query),
		);
	}, [models, search]);

	if (isLoading || !selectedProvider)
		return (
			<div className="w-32 sm:w-48 h-7 bg-muted rounded-full animate-pulse" />
		);

	if (error)
		return (
			<div className="w-32 sm:w-48 h-7 text-xs text-foreground-muted flex items-center px-2">
				Failed to load models
			</div>
		);

	return (
		<Select
			value={selectedModel?.id ?? ""}
			disabled={models.length === 0}
			onOpenChange={(open) => {
				if (open) setSearch("");
			}}
			onValueChange={(val) => {
				setSelectedModel(models.find((m) => m.id === val) ?? null);
			}}
		>
			<SelectTrigger
				size="sm"
				className="w-40 sm:w-52 h-7 bg-transparent border-none shadow-none text-xs hover:bg-accent focus-visible:ring-0"
			>
				<SelectValue placeholder={models.length === 0 ? "No models" : "Model"}>
					{selectedModel?.name}
				</SelectValue>
			</SelectTrigger>
			<SelectContent
				side="top"
				sideOffset={-10}
				align="start"
				className="h-full"
				listHeader={<SearchField value={search} onChange={setSearch} />}
			>
				<SelectGroup>
					<SelectLabel>Models</SelectLabel>
					{filteredModels?.map((m) => (
						<SelectItem key={m.id} value={m.id}>
							<p title={m.name} className="truncate max-w-28 sm:max-w-40">
								{m.name}
							</p>
						</SelectItem>
					))}
				</SelectGroup>
				{filteredModels.length === 0 && (
					<div className="px-3 pb-2 text-xs text-muted-foreground">
						No models found
					</div>
				)}
			</SelectContent>
		</Select>
	);
}
