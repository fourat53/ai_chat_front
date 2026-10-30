import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/sidebar/ChatSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatProvider from "@/providers/chat-provider";

export default function SidebarLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ChatProvider>
			<SidebarProvider className="flex w-full overflow-hidden h-svh">
				<ChatSidebar />
				<SidebarInset className="relative flex flex-col flex-1 h-full">
					<ChatHeader />
					<div className="h-full p-2">
						<div className="z-10 flex flex-col flex-1 w-full h-full min-h-0 overflow-y-auto border rounded-xl bg-background">
							{children}
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</ChatProvider>
	);
}
