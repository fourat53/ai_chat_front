"use client";

import { IconMessage, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
	deleteConversation,
	getConversations,
} from "@/actions/conversation.action";
import { deleteMessagesByConversation } from "@/actions/message.action";
import {
	createNewConversation,
	selectConversation,
} from "@/client/conversation.client";
import ThemeSwitch from "@/components/buttons/ThemeSwitch";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
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

	const handleNewChat = async () => {
		if (selectedConv) {
			void selectConversation(null, { setMessages, stop });
		}
		const conversation = await createNewConversation(!!session?.user);
		if (!conversation) return;
		setMessages([]);
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
		<Sidebar variant="inset" collapsible="offcanvas" className="p-0 pb-2.5 m-0">
			<SidebarHeader className="flex flex-row justify-between items-center px-4 h-16">
				<h2 className="font-bold text-xl tracking-tight truncate flex-1 group-data-[collapsible=icon]:hidden">
					Chat AI
				</h2>
				<ThemeSwitch className="group-data-[collapsible=icon]:hidden" />
			</SidebarHeader>
			<div className="mx-2 border-b " />
			<SidebarContent className="px-1">
				<SidebarGroup className="h-full">
					<SidebarGroupContent className="h-full">
						<SidebarMenu className="relative h-full">
							<Button
								variant="default"
								icon={<IconPlus strokeWidth={2.5} />}
								className="my-1 w-full flex gap-2 justify-start items-center"
								onClick={() => void handleNewChat()}
							>
								New Chat
							</Button>
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
										className="rounded-md hover:bg-muted/50 group/item flex items-center justify-between"
									>
										<SidebarMenuButton
											isActive={selectedConv?.id === conv.id}
											className="pr-2 rounded-none rounded-l-md flex-1"
											onClick={() => handleSelectConversation(conv.id)}
										>
											<IconMessage size={16} />
											<span className="truncate">{conv.title}</span>
										</SidebarMenuButton>
										<SidebarMenuButton
											isActive={selectedConv?.id === conv.id}
											className={cn(
												"size-9 p-2.5 hover:bg-red-600/10 rounded-none rounded-r-md  group-hover/item:opacity-100",
												selectedConv?.id !== conv.id && "opacity-0",
											)}
											onClick={() => handleDeleteConversation(conv.id)}
										>
											<IconTrash size={14} />
										</SidebarMenuButton>
									</SidebarMenuItem>
								))
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<div className="mx-2 border-b" />

			<FooterSidebar session={session} sessionPending={sessionPending} />
		</Sidebar>
	);
}
