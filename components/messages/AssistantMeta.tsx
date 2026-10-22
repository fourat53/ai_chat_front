"use client";

import { useChatStore } from "@/store/useChatStore";
import type { Message, MessageMeta } from "@/types/message.type";

interface AssistantMetaProps {
	message: Message;
	isLast?: boolean;
}

export default function AssistantMeta({ message, isLast }: AssistantMetaProps) {
	const pendingMeta = useChatStore((state) => state.pendingMeta);

	function resolveMeta(): MessageMeta | null {
		if (message.providerName && message.modelName) {
			return {
				providerName: message.providerName,
				modelName: message.modelName,
			};
		}
		return isLast ? (pendingMeta ?? null) : null;
	}

	const meta = resolveMeta();

	if (!meta) return null;
	return (
		<div
			title={`${meta.providerName} · ${meta.modelName}`}
			className="pb-2 font-medium flex flex-wrap gap-1.5 items-center text-xs text-muted-foreground"
		>
			<span>{meta.providerName}</span>
			<span className="text-lg font-semibold">·</span>
			<span>{meta.modelName}</span>
		</div>
	);
}
