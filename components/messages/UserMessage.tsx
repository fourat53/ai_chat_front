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
		<div className="flex flex-col w-full gap-1 transition-colors rounded-2xl group">
			<div className="flex flex-col items-end flex-1 min-w-0 gap-2">
				<div className="flex items-center justify-center overflow-hidden rounded-full size-8">
					{session?.user.image ? (
						<Image
							src={session.user.image}
							alt="User avatar"
							width={32}
							height={32}
						/>
					) : (
						session?.user.name && (
							<p className="flex items-center justify-center text-base font-bold rounded-full size-8 bg-primary/20 text-primary">
								{session.user.name?.[0].toUpperCase()}
							</p>
						)
					)}
				</div>
				<div className="max-w-3/5 whitespace-pre-wrap px-4.5 py-2.75 bg-sidebar shadow-sm border-2 rounded-full">
					{message.content}
				</div>
			</div>
			<div className="flex items-center justify-end transition-opacity opacity-0 shrink-0 group-hover:opacity-100">
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
