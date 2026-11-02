"use client";

import { useChat } from "@ai-sdk/react";
import { IconPlayerStopFilled, IconSend } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { createMessage } from "@/actions/message.action";
import { chat } from "@/client/chat.client";
import {
	createNewConversation,
	selectConversation,
} from "@/client/conversation.client";
import FilesButton from "@/components/buttons/FilesButton";
import FilesSelect from "@/components/selects/FilesSelect";
import ModelsSelect from "@/components/selects/ModelsSelect";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { useChatStore } from "@/store/useChatStore";

export default function ChatInput() {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, isPending: sessionPending } = useSession();
	const { sendMessage, status, stop } = useChat({ chat });
	const {
		selectedModel,
		selectedProvider,
		selectedConv,
		setPendingMeta,
		input,
		setInput,
		uploadingFile,
	} = useChatStore(
		useShallow((state) => ({
			selectedModel: state.selectedModel,
			selectedProvider: state.selectedProvider,
			selectedConv: state.selectedConv,
			setPendingMeta: state.setPendingMeta,
			input: state.input,
			setInput: state.setInput,
			uploadingFile: state.uploadingFile,
		})),
	);

	const sendingRef = useRef(false);

	useEffect(() => {
		if (sessionPending) return;
		if (pathname === "/") {
			void selectConversation(null);
			return;
		}
		const id = pathname.slice(1);
		if (useChatStore.getState().selectedConv?.id === id) return;
		if (
			!session?.user &&
			!useChatStore.getState().conversations.some((conv) => conv.id === id)
		) {
			useChatStore.getState().setLoadingConv(false);
			return;
		}
		void selectConversation(id);
	}, [pathname, session, sessionPending]);

	const submitMessage = async () => {
		if (sendingRef.current) return;
		const text = input.trim();
		if (!text || !selectedProvider || !selectedModel) return;
		if (status === "submitted" || status === "streaming") return;

		sendingRef.current = true;
		try {
			const conversation =
				selectedConv ?? (await createNewConversation(!!session?.user));
			if (!conversation) return;
			if (!selectedConv) {
				router.replace(`/${conversation.id}`);
			}

			const convFiles =
				useChatStore.getState().convFiles[conversation.id] ?? [];
			const selectedRagFiles = convFiles.filter((file) => file.selected);

			if (session?.user) {
				try {
					await createMessage({
						conversationId: conversation.id,
						role: "user",
						content: text,
					});
				} catch (error) {
					console.error("Failed to save user message:", error);
					toast.error("Failed to save the message. Try again.");
					return;
				}
			}

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
						provider: selectedProvider.id,
						model: selectedModel.id,
						baseUrl: selectedProvider.baseUrl,
						ragFiles: selectedRagFiles.length ? selectedRagFiles : undefined,
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
		<form
			onSubmit={handleSubmit}
			className="md:max-w-3xl lg:max-w-4xl mx-auto transition-all border shadow-xl rounded-3xl bg-sidebar focus-within:ring-2 focus-within:ring-ring/50"
		>
			<textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Ask anything..."
				className="w-full p-4 pb-2 text-sm outline-none resize-none max-h-96 min-h-12 placeholder:text-muted-foreground rounded-t-3xl"
				rows={1}
				style={{ height: "auto" }}
				onInput={(e) => {
					const target = e.target as HTMLTextAreaElement;
					target.style.height = "auto";
					target.style.height = `${target.scrollHeight}px`;
				}}
			/>
			<div className="z-10 flex flex-wrap items-center justify-between p-2 pt-0 sm:gap-2">
				<div className="flex flex-wrap items-center sm:gap-2">
					<FilesButton />
					<FilesSelect />
				</div>
				<div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
					<ModelsSelect />
					<div className="w-px h-4 mx-px max-sm:hidden bg-border" />
					<Button
						size="icon"
						type="submit"
						className="rounded-full size-8 sm:size-9"
						disabled={
							uploadingFile !== null ||
							(!isLoading && (!input || input.trim() === ""))
						}
						icon={isLoading ? <IconPlayerStopFilled /> : <IconSend />}
						onClick={(event) => {
							if (!isLoading) return;
							event.preventDefault();
							stop();
						}}
					/>
				</div>
			</div>
		</form>
	);
}
