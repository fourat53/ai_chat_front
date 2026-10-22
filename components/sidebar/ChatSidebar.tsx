"use client";

import { IconMessage, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	deleteConversation,
	getConversations,
} from "@/actions/conversation.action";
import ThemeSwitch from "@/components/buttons/ThemeSwitch";
import MainLoader from "@/components/loaders/MainLoader";
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
import {
	createNewConversation,
	selectConversation,
} from "@/functions/conversation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";
import FooterSidebar from "./FooterSidebar";

export default function ChatSidebar() {
	const { data: session, isPending: sessionPending } = useSession();
	const { setMessages, stop } = useChat();
	const { conversations, setConversations, selectedConversation } =
		useChatStore(
			useShallow((s) => ({
				conversations: s.conversations,
				setConversations: s.setConversations,
				selectedConversation: s.selectedConversation,
			})),
		);

	const { data, isLoading, error } = useQuery({
		queryKey: ["conversations"],
		queryFn: () => getConversations(),
		enabled: !!session?.user,
	});

	useEffect(() => {
		if (!data) return;
		setConversations(data);
	}, [data, setConversations]);

	const handleSelectConversation = (id: string) => {
		void selectConversation(id, { setMessages, stop });
	};

	const handleNewChat = async () => {
		if (selectedConversation) {
			void selectConversation(null, { setMessages, stop });
		}
		const conversation = await createNewConversation(!!session?.user);
		if (!conversation) return;
		setMessages([]);
	};

	const handleDeleteConversation = async (id: string) => {
		if (session?.user) {
			await deleteConversation(id);
			setConversations(conversations.filter((c) => c.id !== id));
		} else {
			setConversations(conversations.filter((c) => c.id !== id));
		}
		if (selectedConversation?.id === id) {
			void selectConversation(null, { setMessages, stop });
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
								icon={<IconPlus size={18} />}
								className="my-1 flex gap-2 justify-start items-center w-full"
								onClick={() => void handleNewChat()}
							>
								New Chat
							</Button>
							{sessionPending || isLoading ? (
								<div className="absolute h-full w-full flex justify-center items-center">
									<MainLoader />
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
											isActive={selectedConversation?.id === conv.id}
											className="pr-2 rounded-none rounded-l-md flex-1"
											onClick={() => handleSelectConversation(conv.id)}
										>
											<IconMessage size={16} />
											<span className="truncate">{conv.title}</span>
										</SidebarMenuButton>
										<SidebarMenuButton
											isActive={selectedConversation?.id === conv.id}
											className={cn(
												"size-9 p-2.5 hover:bg-red-600/10 rounded-none rounded-r-md  group-hover/item:opacity-100",
												selectedConversation?.id !== conv.id && "opacity-0",
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
