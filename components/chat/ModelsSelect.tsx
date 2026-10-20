"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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

export default function ModelsSelect() {
	const {
		models,
		setModels,
		selectedModel,
		setSelectedModel,
		selectedProvider,
	} = useChatStore();

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
			>
				<SelectGroup>
					<SelectLabel>Models</SelectLabel>
					{models?.map((m) => (
						<SelectItem key={m.id} value={m.id}>
							<p title={m.name} className="truncate max-w-28 sm:max-w-40">
								{m.name}
							</p>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
