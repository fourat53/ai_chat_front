"use client";

import ProvidersSelect from "@/components/selects/ProvidersSelect";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useChatStore } from "@/store/useChatStore";

export default function ChatHeader() {
	const selectedConv = useChatStore((state) => state.selectedConv);
	return (
		<div className="w-full lg:pb-2 flex justify-between items-center px-2 sm:px-4 h-12">
			<div className="w-full flex gap-2 items-center">
				<SidebarTrigger className="size-9" />
				<span
					title={selectedConv?.title || "New Chat"}
					className="ml-2 sm:text-base font-medium truncate min-w-0 max-w-1/2"
				>
					{selectedConv?.title || "New Chat"}
				</span>
			</div>
			<ProvidersSelect />
		</div>
	);
}
