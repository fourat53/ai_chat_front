"use client";

import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatSidebar from "@/components/sidebar/ChatSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatProvider from "@/providers/chat-provider";

export default function HomePage() {
	return (
		<ChatProvider>
			<SidebarProvider className="flex overflow-hidden w-full h-screen bg-background">
				<ChatSidebar />
				<SidebarInset className="flex relative flex-col flex-1 h-full bg-transparent">
					<ChatHeader />
					<ChatMessages />
					<div className="relative lg:mb-4 w-full lg:rounded-b-xl border border-t-0 bg-background">
						<ChatInput />
						<div className="z-20 text-center p-2 text-xs text-muted-foreground">
							AI can make mistakes. Consider verifying important information.
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ChatProvider>
	);
}
