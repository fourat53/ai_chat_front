import { IconCopy } from "@tabler/icons-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import handleCopy from "@/lib/functions/handleCopy";
import type { Message } from "@/types/message.type";

type UserMessageProps = {
	message: Message;
};

export function UserMessage({ message }: UserMessageProps) {
	const { data: session } = useSession();
	return (
		<div className="flex flex-col gap-1 w-full rounded-2xl transition-colors group">
			<div className="flex min-w-0 flex-1 flex-col items-end gap-2">
				<div className="flex overflow-hidden justify-center items-center rounded-full size-8">
					{session?.user.image ? (
						<Image
							src={session.user.image}
							alt="User avatar"
							width={32}
							height={32}
						/>
					) : (
						session?.user.name && (
							<p className="flex justify-center items-center text-base font-bold rounded-full size-8 bg-primary/20 text-primary">
								{session.user.name?.[0].toUpperCase()}
							</p>
						)
					)}
				</div>
				<div className="max-w-3/5 whitespace-pre-wrap px-4.5 py-3.5 bg-sidebar shadow-sm border rounded-2xl">
					{message.content}
				</div>
			</div>
			<div className="shrink-0 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
				<Button
					variant="ghost"
					size="icon"
					className="size-8 p-0.5 hover:bg-secondary/80 dark:hover:bg-secondary/70"
					onClick={() => handleCopy(message.content)}
				>
					<IconCopy size={16} />
				</Button>
			</div>
		</div>
	);
}
