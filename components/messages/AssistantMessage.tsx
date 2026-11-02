import { IconCopy } from "@tabler/icons-react";
import type { ChatStatus } from "ai";
import { LoaderDots } from "@/components/loaders/WaitingDots";
import { Button } from "@/components/ui/button";
import handleCopy from "@/lib/functions/handleCopy";
import type { Message } from "@/types/message.type";
import AssistantContent from "./AssistantContent";
import AssistantMeta from "./AssistantMeta";

type AssistantMessageProps = {
	message: Message;
	isLast?: boolean;
	status?: ChatStatus;
};

export function AssistantMessage({
	message,
	isLast = false,
	status,
}: AssistantMessageProps) {
	const isWaiting =
		isLast &&
		(status === "submitted" || status === "streaming") &&
		!message.content;
	return (
		<div className="flex flex-col gap-1 w-full rounded-2xl transition-colors group">
			<div className="min-w-0 flex-1 space-y-2 font-light prose prose-sm dark:prose-invert prose-pre:bg-transparent prose-pre:p-0 prose-p:leading-relaxed">
				<AssistantMeta message={message} isLast={isLast} />
				{isWaiting ? (
					<LoaderDots />
				) : (
					<AssistantContent content={message.content} />
				)}
			</div>
			<div className="shrink-0 -mt-2 pb-4 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
				<Button
					variant="ghost"
					size="icon"
					className="size-8 p-0.5 hover:bg-sidebar/60"
					onClick={() => handleCopy(message.content)}
				>
					<IconCopy />
				</Button>
			</div>
		</div>
	);
}
