"use client";

import {
	// IconLink, IconSearch,
	IconLoader2,
	IconSend,
} from "@tabler/icons-react";
import type { ChatStatus } from "ai";
import { createConversation } from "@/actions/conversation.action";
import { Button } from "@/components/ui/button";
import type { SessionType } from "@/lib/auth-client";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/conversation.type";
import ModelsSelect from "./ModelsSelect";

interface ChatInputProps {
	stop?: () => void;
	status: ChatStatus;
	session: SessionType;
	sendMessage: (
		message: { text: string },
		options?: { body?: object },
	) => Promise<void>;
}

export function ChatInput({
	stop,
	status,
	session,
	sendMessage,
}: ChatInputProps) {
	const {
		input,
		setInput,
		conversations,
		setConversations,
		selectedModel,
		selectedProvider,
		setSelectedConversation,
	} = useChatStore();

	const submitMessage = async () => {
		if (!input.trim() || !selectedProvider || !selectedModel) return;

		const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
		let newConversation: Conversation;

		if (session?.user) {
			try {
				const created = await createConversation({
					title,
					providerId: selectedProvider.id,
					modelId: selectedModel.id,
				});

				if (!created._id) return;

				newConversation = { ...created, id: created._id, title };
				setConversations([newConversation, ...conversations]);
			} catch (err) {
				console.error("Failed to create conversation:", err);
				return;
			}
		} else {
			const convId = crypto.randomUUID();

			newConversation = {
				id: convId,
				userId: `guest-${convId}`,
				providerId: selectedProvider.id,
				modelId: selectedModel.id,
				title,
			};

			setConversations([newConversation, ...conversations]);
		}

		setSelectedConversation(newConversation);

		await sendMessage(
			{ text: input.trim() },
			{
				body: {
					provider: selectedProvider.label,
					model: selectedModel.id,
					baseUrl: selectedProvider.baseUrl,
				},
			},
		);

		setInput("");
	};

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		void submitMessage();
	};

	const isLoading = status === "submitted" || status === "streaming";

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			setInput("");
			if (isLoading && stop) {
				stop();
			} else if (input) {
				handleSubmit(e as unknown as React.SubmitEvent<HTMLFormElement>);
			}
		}
	};

	return (
		<div className="px-2 sm:px-4 md:px-0 lg:px-4 md:mx-auto md:max-w-2xl lg:max-w-3xl">
			<form
				onSubmit={handleSubmit}
				className="pt-2 rounded-3xl border shadow-xl transition-all bg-sidebar border-border focus-within:ring-2 focus-within:ring-ring/50"
			>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything..."
					className="w-full max-h-96 min-h-15 resize-none p-4 outline-none text-sm placeholder:text-muted-foreground"
					rows={1}
					style={{ height: "auto" }}
					onInput={(e) => {
						const target = e.target as HTMLTextAreaElement;
						target.style.height = "auto";
						target.style.height = `${target.scrollHeight}px`;
					}}
				/>

				<div className="z-10 pt-1 flex flex-wrap gap-1 sm:gap-2 justify-between items-center p-2">
					<ModelsSelect />

					{/*
					 * Two separate buttons: Base UI Button always renders
					 * type="button" unless overridden, and `loading` implies
					 * `disabled` — which would make the send button impossible
					 * to click. While streaming it becomes a clickable stop
					 * control instead of a disabled spinner.
					 */}
					{isLoading ? (
						<Button
							type="button"
							size="icon"
							className="rounded-full size-8 sm:size-9"
							onClick={(event) => {
								event.preventDefault();
								stop?.();
							}}
							icon={<IconLoader2 className="animate-spin" />}
						/>
					) : (
						<Button
							type="submit"
							size="icon"
							className="rounded-full size-8 sm:size-9"
							disabled={!input || input.trim() === ""}
							icon={<IconSend size={16} />}
						/>
					)}
				</div>
			</form>
		</div>
	);
}

// <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
// <Button
// 		variant="ghost"
// 		size="icon"
// 		className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
// 	>
// 		<IconLink size={20} />
// 	</Button>
// 	<div className="mx-px w-px h-4 bg-border" />
// 	<Button
// 		variant="ghost"
// 		size="icon"
// 		className="rounded-full size-8 sm:size-9 text-muted-foreground hover:text-foreground"
// 	>
// 		<IconSearch size={20} />
// 	</Button>
// 	<div className="mx-px w-px h-4 bg-border" />
// </div>
