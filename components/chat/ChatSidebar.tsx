"use client";

import {
	IconLoader2,
	IconMessage,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import {
	deleteConversation,
	getConversations,
} from "@/actions/conversation.action";
import { LogoutButton } from "@/components/reusable/logout-button";
import ThemeSwitch from "@/components/reusable/ThemeSwitch";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	createNewConversation,
	selectConversation,
} from "@/functions/conversation";
import type { SessionType } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

interface ChatSidebarProps {
	setMessages: (messages: Message[]) => void;
	stop?: () => void;
	session: SessionType;
	sessionPending: boolean;
}

export function ChatSidebar({
	setMessages,
	stop,
	session,
	sessionPending,
}: ChatSidebarProps) {
	const { conversations, setConversations, selectedConversation } =
		useChatStore();

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
		selectConversation(id, { setMessages, stop });
	};

	const handleNewChat = async () => {
		if (selectedConversation) {
			selectConversation(null, { setMessages, stop });
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
			selectConversation(null, { setMessages, stop });
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
						<SidebarMenu className="h-full">
							<Button
								variant="default"
								icon={<IconPlus size={18} />}
								className="my-1 flex gap-2 justify-start items-center w-full"
								onClick={() => void handleNewChat()}
							>
								New Chat
							</Button>
							{isLoading ? (
								<div className="h-full w-full flex justify-center items-center">
									<IconLoader2 className="animate-spin" />
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
			<SidebarFooter className="px-4 py-2">
				{session ? (
					<div className="h-12 flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
						<div className="h-full flex justify-between items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
							<div className="flex items-center gap-2 text-sm text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
								<div className="flex overflow-hidden justify-center items-center rounded-full size-9">
									{session.user.image ? (
										<Image
											src={session.user.image}
											alt="User avatar"
											width={36}
											height={36}
										/>
									) : (
										session.user.name && (
											<p className="flex justify-center items-center text-base font-bold rounded-full size-9 bg-primary/20 text-primary">
												{session.user.name?.[0].toUpperCase()}
											</p>
										)
									)}
								</div>

								<span className="truncate group-data-[collapsible=icon]:hidden">
									{session.user.name || session.user.email}
								</span>
							</div>
							<LogoutButton variant="icon" />
						</div>
					</div>
				) : sessionPending ? (
					<div
						aria-hidden="true"
						className="h-12 flex justify-center items-center gap-2 group-data-[collapsible=icon]:flex-col"
					>
						<Skeleton className="shrink-0 rounded-full size-9" />
						<Skeleton className="h-4 flex-1 group-data-[collapsible=icon]:hidden" />
					</div>
				) : (
					<div className="h-12 text-center flex flex-col justify-center gap-1.5 group-data-[collapsible=icon]:hidden">
						<p className="px-2 text-xs text-muted-foreground">
							Sign in for access to chat history.
						</p>
						<Link href="/login" className="block">
							<Button variant="secondary" className="w-full h-8">
								Sign In
							</Button>
						</Link>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
