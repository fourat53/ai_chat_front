import { IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import handleCopy from "@/lib/functions/handleCopy";
import type { Message } from "@/types/message.type";

type UserMessageProps = {
	message: Message;
};

export function UserMessage({ message }: UserMessageProps) {
	return (
		<div className="flex flex-col gap-1 items-end w-full group">
			<div className="z-10 max-w-9/10 sm:max-w-3/5 whitespace-pre-wrap px-4.5 py-2.75 bg-sidebar shadow-sm border-2 rounded-3xl">
				{message.content}
			</div>
			<div className="shrink-0 pb-4 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
