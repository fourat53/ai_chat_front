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
import { SidebarTrigger } from "../ui/sidebar";

export default function ChatHeader() {
	const {
		providers,
		setProviders,
		selectedProvider,
		setSelectedProvider,
		selectedConversation,
	} = useChatStore();

	const {
		data: dataProviders,
		isLoading: loadingProviders,
		error: errorProviders,
	} = useQuery({
		queryKey: ["providers"],
		queryFn: () => getProviders(),
	});

	useEffect(() => {
		if (!dataProviders) return;
		setProviders(dataProviders);
	}, [dataProviders, setProviders]);

	useEffect(() => {
		if (providers && providers.length > 0) {
			setSelectedProvider(providers[0]);
		}
	}, [providers, setSelectedProvider]);

	return (
		<div className="w-full lg:pb-2 flex justify-between items-center px-2 sm:px-4 h-12">
			<div className="w-full flex gap-2 items-center">
				<SidebarTrigger className="size-9" />
				<span
					title={selectedConversation?.title || "New Chat"}
					className="ml-2 sm:text-lg font-medium truncate min-w-0 max-w-1/2"
				>
					{selectedConversation?.title || "New Chat"}
				</span>
			</div>
			{loadingProviders ? (
				<div className="w-40 h-7 bg-muted rounded-full animate-pulse" />
			) : errorProviders ? (
				<div className="w-40 h-7 text-xs text-foreground-muted flex items-center px-2">
					Failed to load providers
				</div>
			) : (
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
			)}
		</div>
	);
}
