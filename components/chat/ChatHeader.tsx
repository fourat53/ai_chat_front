"use client";

import ProvidersSelect from "@/components/selects/ProvidersSelect";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useChatStore } from "@/store/useChatStore";
import { Skeleton } from "../ui/skeleton";

export default function ChatHeader() {
	const selectedConv = useChatStore((state) => state.selectedConv);
	return (
		<div className="flex items-center justify-between w-full h-12 p-2 pb-0">
			<div className="flex items-center w-full gap-2">
				<SidebarTrigger className="size-9" />
				{selectedConv?.title ? (
					<span
						title={selectedConv?.title}
						className="min-w-0 font-medium truncate max-sm:hidden sm:text-base max-w-1/2"
					>
						{selectedConv?.title}
					</span>
				) : (
					<Skeleton className="h-4 rounded-full w-50" />
				)}
			</div>
			<ProvidersSelect />
		</div>
	);
}
