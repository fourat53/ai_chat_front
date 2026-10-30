import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";

export default function HomePage() {
	return (
		<div className="relative pb-30 h-[calc(100svh-66px)] overflow-hidden">
			<ChatMessages />
			<div className="absolute bottom-0 w-full px-4 rounded-t-3xl bg-background">
				<ChatInput />
				<div className="py-1 text-xs text-center text-muted-foreground">
					AI can make mistakes. Consider verifying important information.
				</div>
			</div>
		</div>
	);
}
