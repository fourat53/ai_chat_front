"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { saveConversationSelection } from "@/client/conversation.client";
import Select from "@/components/selects/Select";
import { useSession } from "@/lib/auth/auth-client";
import { useChatStore } from "@/store/useChatStore";
import { PROVIDERS } from "@/types/provider.type";

export default function ProvidersSelect() {
	const { data: session } = useSession();
	const { selectedProvider, setSelectedProvider, selectedConv } = useChatStore(
		useShallow((s) => ({
			selectedProvider: s.selectedProvider,
			setSelectedProvider: s.setSelectedProvider,
			selectedConv: s.selectedConv,
		})),
	);

	useEffect(() => {
		const remembered = selectedConv
			? PROVIDERS.find((p) => p.id === selectedConv.providerId)
			: undefined;
		setSelectedProvider(remembered ?? PROVIDERS[0]);
	}, [selectedConv, setSelectedProvider]);

	return (
		<Select
			items={PROVIDERS.map((provider) => ({
				value: provider.id,
				label: provider.name,
			}))}
			value={selectedProvider?.id ?? null}
			onValueChange={(id) => {
				const provider = PROVIDERS.find((p) => p.id === id) ?? null;
				setSelectedProvider(provider);
				void saveConversationSelection(!!session?.user, {
					providerId: provider?.id ?? "",
				});
			}}
			placeholder="Provider"
			size="sm"
			disabled={PROVIDERS.length === 0}
			triggerClassName="w-32 sm:w-40 h-7 bg-transparent border-none shadow-none text-xs hover:bg-accent focus-visible:ring-0"
			searchable
		/>
	);
}
