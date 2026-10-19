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
import { useCallback, useEffect } from "react";
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
import type { SessionType } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { Message } from "@/types/message.type";

interface ChatSidebarProps {
	setMessages: (messages: Message[]) => void;
	session: SessionType;
}

export function ChatSidebar({ setMessages, session }: ChatSidebarProps) {
	const {
		models,
		setSelectedModel,
		providers,
		setSelectedProvider,
		conversations,
		setConversations,
		selectedConversation,
		setSelectedConversation,
	} = useChatStore();

	const {
		data: dataConversations,
		isLoading: loadingConversations,
		error: errorConversations,
	} = useQuery({
		queryKey: ["conversations"],
		queryFn: () => getConversations(),
		enabled: !!session?.user,
	});

	useEffect(() => {
		if (!dataConversations) return;
		setConversations(dataConversations);
	}, [dataConversations, setConversations]);

	const handleSelectConversation = useCallback(
		(id: string) => {
			if (!id) {
				setSelectedConversation(null);
				setMessages([]);
				return;
			}
			const conv = conversations.find((c) => c.id === id);
			if (!conv) return;
			if (!conv.messages) return;
			setSelectedConversation(conv);
			setMessages(
				conv.messages.map((m) => ({
					id: m.id,
					role: m.role,
					parts: [{ type: "text", text: m.content }],
				})) as Message[],
			);
			setSelectedProvider(
				providers.find((p) => p.id === conv.providerId) || null,
			);
			setSelectedModel(models.find((m) => m.id === conv.modelId) || null);
		},
		[
			setSelectedConversation,
			setSelectedProvider,
			setSelectedModel,
			setMessages,
			conversations,
			providers,
			models,
		],
	);

	const handleDeleteConversation = async (id: string) => {
		if (session?.user) {
			await deleteConversation(id);
			setConversations(conversations.filter((c) => c.id !== id));
		} else {
			setConversations(conversations.filter((c) => c.id !== id));
		}
		if (selectedConversation?.id === id) {
			setSelectedConversation(null);
			setMessages([]);
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
			<div className="mx-2 border-b border-border" />
			<SidebarContent className="px-1">
				<SidebarGroup className="h-full">
					<SidebarGroupContent className="h-full">
						<SidebarMenu className="h-full">
							<Button
								variant="default"
								icon={<IconPlus size={18} />}
								className="my-1 flex gap-2 justify-start items-center w-full"
								onClick={() => handleSelectConversation("")}
							>
								New Chat
							</Button>
							{loadingConversations ? (
								<div className="h-full w-full flex justify-center items-center">
									<IconLoader2 className="animate-spin" />
								</div>
							) : errorConversations ? (
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

			<div className="mx-2 border-b border-border" />
			<SidebarFooter className="p-4">
				{session ? (
					<div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
						<div className="flex justify-between items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
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
				) : (
					<div className="text-center space-y-3 group-data-[collapsible=icon]:hidden">
						<p className="px-2 text-xs text-muted-foreground">
							Sign in to save your chat history and sync across devices.
						</p>
						<Link href="/login" className="block">
							<Button variant="outline" className="w-full">
								Sign In
							</Button>
						</Link>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
