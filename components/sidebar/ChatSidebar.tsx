"use client";

import {
	IconBooks,
	IconKey,
	IconMessage,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useChatStore } from "@/store/useChatStore";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import FooterSidebar from "./FooterSidebar";

export default function ChatSidebar() {
	const { data: session, isPending: sessionPending } = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const { conversations, setConversations, selectedConv } = useChatStore(
		useShallow((s) => ({
			conversations: s.conversations,
			setConversations: s.setConversations,
			selectedConv: s.selectedConv,
		})),
	);

	const { data, isLoading, error } = useQuery({
		queryKey: ["conversations"],
		queryFn: getConversations,
		enabled: !!session?.user,
	});

	useEffect(() => {
		if (data) {
			setConversations(data);
		} else if (error) {
			toast.error("Failed to load user conversations. Try to refresh.");
		}
	}, [data, error, setConversations]);

	const handleSelectConversation = (id: string) => {
		router.push(`/${id}`);
		void selectConversation(id);
	};

	const handleNewChat = () => {
		if (pathname !== "/") {
			router.push("/");
		}
		void selectConversation(null);
	};

	const handleDeleteConversation = async (id: string) => {
		try {
			if (session?.user) {
				await deleteMessagesByConversation(id);
				await deleteConversation(id);
			}
			setConversations(conversations.filter((c) => c.id !== id));
			if (selectedConv?.id === id) {
				void selectConversation(null);
			}
			if (pathname === `/${id}`) {
				router.push("/");
			}
			toast.success("Conversation deleted.");
		} catch (error) {
			console.error("Failed to delete conversation:", error);
			toast.error("Failed to delete the conversation. Try again.");
		}
	};

	return (
		<Sidebar
			variant="inset"
			collapsible="offcanvas"
			className="p-2 pb-0 pr-0 m-0"
		>
			<SidebarHeader className="flex-row items-center justify-between gap-0 px-0 h-14">
				<h2 className="w-full text-center font-bold text-[22px] tracking-tight truncate group-data-[collapsible=icon]:hidden">
					Chat AI
				</h2>
				<ThemeSwitch className="group-data-[collapsible=icon]:hidden" />
			</SidebarHeader>

			<div className="border-b" />

			<div className="py-2 space-y-1.5">
				<SidebarMenuButton
					variant="outline"
					className={cn(
						"font-medium",
						pathname === "/" && "bg-primary hover:bg-primary",
					)}
					onClick={() => void handleNewChat()}
				>
					<IconPlus strokeWidth={2.5} className="min-h-5 min-w-5" />
					New Chat
				</SidebarMenuButton>
				{session && (
					<>
						<SidebarMenuButton
							render={<Link href="/api-keys" />}
							isActive={pathname === "/api-keys"}
						>
							<IconKey className="min-h-5 min-w-5" />
							API keys
						</SidebarMenuButton>
						<SidebarMenuButton
							render={<Link href="/library" />}
							isActive={pathname === "/library"}
						>
							<IconBooks strokeWidth={1.5} className="min-h-5 min-w-5" />
							Files library
						</SidebarMenuButton>
						<div className="border-b" />
					</>
				)}
			</div>

			<SidebarMenu className="relative h-full pb-2 overflow-y-auto">
				{sessionPending || isLoading ? (
					<div className="flex flex-col gap-2.25">
						{Array.from({ length: 3 }).map((_, index) => (
							<Skeleton
								key={index}
								className="h-7.75 rounded-[10px] bg-background dark:bg-sidebar-accent"
								style={{ animationDelay: `${index * 150}ms` }}
							/>
						))}
					</div>
				) : (
					conversations.map((conv) => (
						<SidebarMenuItem
							key={conv.id}
							title={conv.title}
							className="relative rounded-md group/item"
						>
							<SidebarMenuButton
								isActive={pathname === `/${conv.id}`}
								onClick={() => handleSelectConversation(conv.id)}
								className="group-hover/item:bg-background dark:group-hover/item:bg-sidebar-accent"
							>
								<IconMessage />
								<span className="truncate group-hover/item:max-w-3/4">
									{conv.title}
								</span>
							</SidebarMenuButton>
							<Button
								onClick={() => handleDeleteConversation(conv.id)}
								className={cn(
									"hidden group-hover/item:block absolute right-0 top-0 size-9 p-2.5 rounded-none rounded-r-md hover:text-white group-hover/item:text-black dark:group-hover/item:text-white hover:bg-red-400 dark:hover:bg-red-900 group-hover/item:bg-transparent border-none",
								)}
							>
								<IconTrash />
							</Button>
						</SidebarMenuItem>
					))
				)}
			</SidebarMenu>

			<div className="border-b" />

			<FooterSidebar session={session} sessionPending={sessionPending} />
		</Sidebar>
	);
}
