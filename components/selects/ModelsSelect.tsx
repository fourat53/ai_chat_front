"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import Select from "@/components/selects/Select";
import { useChatStore } from "@/store/useChatStore";
import type { Model } from "@/types/model.type";

export default function ModelsSelect() {
	const {
		models,
		setModels,
		selectedModel,
		setSelectedModel,
		selectedProvider,
	} = useChatStore(
		useShallow((s) => ({
			models: s.models,
			setModels: s.setModels,
			selectedModel: s.selectedModel,
			setSelectedModel: s.setSelectedModel,
			selectedProvider: s.selectedProvider,
		})),
	);

	const { data, isLoading, error } = useQuery({
		queryKey: ["models", selectedProvider],
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
			<div className="w-32 sm:w-48 h-7 text-xs bg-muted rounded-full animate-pulse" />
		);

	if (error)
		return (
			<div className="w-32 sm:w-48 h-7 text-xs text-foreground-muted flex items-center px-2">
				Failed to load models
			</div>
		);

	return (
		<Select
			items={models.map((model) => ({ value: model.id, label: model.name }))}
			value={selectedModel?.id ?? null}
			onValueChange={(id) => {
				setSelectedModel(models.find((model) => model.id === id) ?? null);
			}}
			placeholder={models.length === 0 ? "No models" : "Model"}
			searchable
			searchPlaceholder="Search models..."
			emptyText="No models found"
			disabled={models.length === 0}
			size="sm"
			triggerClassName="w-40 sm:w-52 text-xs bg-transparent border-none shadow-none hover:bg-muted focus-visible:ring-0"
		/>
	);
}
