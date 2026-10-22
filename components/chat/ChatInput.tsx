"use client";

import { IconLoader2, IconPaperclip, IconSend } from "@tabler/icons-react";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import ModelsSelect from "@/components/selects/ModelsSelect";
import { Button } from "@/components/ui/button";
import { createNewConversation } from "@/functions/conversation";
import { useSession } from "@/lib/auth-client";
import { useChat } from "@/providers/chat-provider";
import { useChatStore } from "@/store/useChatStore";

export default function ChatInput() {
	const { data: session } = useSession();
	const { sendMessage, status, stop } = useChat();
	const {
		selectedModel,
		selectedProvider,
		selectedConversation,
		setPendingMeta,
		input,
		setInput,
	} = useChatStore(
		useShallow((state) => ({
			selectedModel: state.selectedModel,
			selectedProvider: state.selectedProvider,
			selectedConversation: state.selectedConversation,
			setPendingMeta: state.setPendingMeta,
			input: state.input,
			setInput: state.setInput,
		})),
	);

	const sendingRef = useRef(false);

	const submitMessage = async () => {
		if (sendingRef.current) return;
		const text = input.trim();
		if (!text || !selectedProvider || !selectedModel) return;
		if (status === "submitted" || status === "streaming") return;

		sendingRef.current = true;
		try {
			const conversation =
				selectedConversation ?? (await createNewConversation(!!session?.user));
			if (!conversation) return;

			setInput("");
			setPendingMeta(
				selectedProvider && selectedModel
					? {
							providerName: selectedProvider.name,
							modelName: selectedModel.name,
						}
					: null,
			);

			await sendMessage(
				{ text },
				{
					body: {
						provider: selectedProvider.label,
						model: selectedModel.id,
						baseUrl: selectedProvider.baseUrl,
					},
				},
			);
		} finally {
			sendingRef.current = false;
		}
	};

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		void submitMessage();
	};

	const isLoading = status === "submitted" || status === "streaming";

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (isLoading) {
				stop();
			} else if (input.trim()) {
				handleSubmit(e as unknown as React.SubmitEvent<HTMLFormElement>);
			}
		}
	};

	return (
		<div className="px-2 sm:px-4 md:px-0 lg:px-4 md:mx-auto md:max-w-2xl lg:max-w-3xl">
			<form
				onSubmit={handleSubmit}
				className="rounded-3xl border shadow-xl transition-all bg-sidebar focus-within:ring-2 focus-within:ring-ring/50"
			>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything..."
					className="w-full max-h-96 min-h-12 resize-none p-4 pb-2 outline-none text-sm placeholder:text-muted-foreground rounded-t-3xl"
					rows={1}
					style={{ height: "auto" }}
					onInput={(e) => {
						const target = e.target as HTMLTextAreaElement;
						target.style.height = "auto";
						target.style.height = `${target.scrollHeight}px`;
					}}
				/>

				<div className="z-10 flex flex-wrap gap-1 sm:gap-2 justify-between items-center p-2 pt-0">
					<div className="flex flex-wrap gap-1 sm:gap-2 items-center">
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
						>
							<IconPaperclip size={20} />
						</Button>

						<div className="mx-px w-px h-4 bg-border" />

						<ModelsSelect />
					</div>

					<Button
						size="icon"
						type="submit"
						className="rounded-full size-8 sm:size-9"
						disabled={!isLoading && (!input || input.trim() === "")}
						icon={
							isLoading ? (
								<IconLoader2 className="animate-spin" />
							) : (
								<IconSend />
							)
						}
						onClick={(event) => {
							if (!isLoading) return;
							event.preventDefault();
							stop();
						}}
					/>
				</div>
			</form>
		</div>
	);
}
