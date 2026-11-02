import ChatInput from "@/components/chat/ChatInput";

export default function NewChatPage() {
	return (
		<div className="relative pb-30 h-[calc(100svh-66px)] overflow-hidden">
			<div className="flex flex-col items-center justify-center h-full max-w-md px-2 mx-auto space-y-4 text-center">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					How can I help you today?
				</h1>
				<p className="text-muted-foreground">
					Select a provider and a model, then type a message to start a new
					conversation.
				</p>
			</div>
			<div className="absolute bottom-0 w-full px-4 rounded-t-3xl bg-background">
				<ChatInput />
				<div className="py-1 text-xs text-center text-muted-foreground">
					AI can make mistakes. Consider verifying important information.
				</div>
			</div>
		</div>
	);
}
