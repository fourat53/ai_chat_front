"use client";

import {
	IconKeyFilled,
	IconMessageFilled,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
	deleteConversation,
	getConversations,
} from "@/actions/conversation.action";
import { deleteMessagesByConversation } from "@/actions/message.action";
import { selectConversation } from "@/client/conversation.client";
import ThemeSwitch from "@/components/buttons/ThemeSwitch";
import {
	Sidebar,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import FooterSidebar from "./FooterSidebar";

export default function ChatSidebar() {
	const { data: session, isPending: sessionPending } = useSession();
	const { setMessages, stop } = useChatContext();
	const { conversations, setConversations, selectedConv } = useChatStore(
		useShallow((s) => ({
			conversations: s.conversations,
			setConversations: s.setConversations,
			selectedConv: s.selectedConv,
		})),
	);

	const { data, isLoading, error } = useQuery({
		queryKey: ["conversations"],
		queryFn: () => getConversations(),
		enabled: !!session?.user,
	});

	useEffect(() => {
		if (data) {
			setConversations(data);
			if (data.length === 0 && useChatStore.getState().loadingConv) {
				useChatStore.getState().setLoadingConv(false);
			}
		} else if (error && useChatStore.getState().loadingConv) {
			useChatStore.getState().setLoadingConv(false);
		}
	}, [data, error, setConversations]);

	const handleSelectConversation = (id: string) => {
		void selectConversation(id, { setMessages, stop });
	};

	const handleNewChat = () => {
		void selectConversation(null, { setMessages, stop });
	};

	const handleDeleteConversation = async (id: string) => {
		try {
			if (session?.user) {
				await deleteMessagesByConversation(id);
				await deleteConversation(id);
			}
			setConversations(conversations.filter((c) => c.id !== id));
			if (selectedConv?.id === id) {
				void selectConversation(null, { setMessages, stop });
			}
			toast.success("Conversation deleted.");
		} catch (error) {
			console.error("Failed to delete conversation:", error);
			toast.error("Failed to delete the conversation. Try again.");
		}
	};

	return (
		<Sidebar variant="inset" collapsible="offcanvas" className="p-0 pb-1.5 m-0">
			<SidebarHeader className="gap-0 flex-row justify-between items-center">
				<h2 className="w-full text-center font-bold text-xl tracking-tight truncate group-data-[collapsible=icon]:hidden">
					Chat AI
				</h2>
				<ThemeSwitch className="group-data-[collapsible=icon]:hidden" />
			</SidebarHeader>

			<div className="mx-2 border-b" />

			<div className="p-2 space-y-1.5">
				<SidebarMenuButton
					variant="outline"
					className={cn(
						"font-medium",
						!selectedConv && "bg-primary hover:bg-primary",
					)}
					onClick={() => void handleNewChat()}
				>
					<IconPlus strokeWidth={2.5} />
					New Chat
				</SidebarMenuButton>
				<SidebarMenuButton>
					<IconKeyFilled />
					API Keys
				</SidebarMenuButton>
			</div>

			<div className="mx-2 border-b" />

			<SidebarMenu className="p-2 relative h-full overflow-y-auto">
				{sessionPending || isLoading ? (
					<div className="flex flex-col gap-2.25 ">
						{Array.from({ length: 3 }).map((_, index) => (
							<Skeleton
								key={index}
								className="h-7.75 rounded-[10px]"
								style={{ animationDelay: `${index * 150}ms` }}
							/>
						))}
					</div>
				) : error ? (
					<div className="p-4 pt-20 text-center text-sm text-foreground-muted">
						Failed to load conversations
					</div>
				) : (
					conversations.map((conv) => (
						<SidebarMenuItem
							key={conv.id}
							title={conv.title}
							className="relative rounded-md group/item"
						>
							<SidebarMenuButton
								isActive={selectedConv?.id === conv.id}
								onClick={() => handleSelectConversation(conv.id)}
								className="group-hover/item:bg-background dark:group-hover/item:bg-sidebar-accent"
							>
								<IconMessageFilled />
								<span className="truncate group-hover/item:max-w-3/4">
									{conv.title}
								</span>
							</SidebarMenuButton>
							<Button
								onClick={() => handleDeleteConversation(conv.id)}
								className={cn(
									"hidden group-hover/item:block absolute right-0 top-0 size-9 p-2.5 rounded-none rounded-r-md hover:bg-[#4d1b1b] group-hover/item:bg-transparent border-none",
								)}
							>
								<IconTrash />
							</Button>
						</SidebarMenuItem>
					))
				)}
			</SidebarMenu>

			<div className="mx-2 border-b" />

			<FooterSidebar session={session} sessionPending={sessionPending} />
		</Sidebar>
	);
}
