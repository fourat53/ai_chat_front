"use client";

import type { MessageMeta } from "@/types/message.type";
import { LoaderDots } from "./WaitingDots";

interface PendingMessageProps {
	meta?: MessageMeta | null;
}

export default function PendingMessage({ meta }: PendingMessageProps) {
	return (
		<div className="px-4 sm:px-8 md:px-4 lg:px-8 md:mx-auto md:max-w-2xl lg:max-w-3xl flex flex-col gap-1 w-full rounded-2xl">
			{meta && (
				<div className="flex flex-wrap gap-1.5 items-center text-xs text-muted-foreground">
					<span>{meta.providerName}</span>
					<span>·</span>
					<span className="font-medium">{meta.modelName}</span>
				</div>
			)}
			<LoaderDots />
		</div>
	);
}
