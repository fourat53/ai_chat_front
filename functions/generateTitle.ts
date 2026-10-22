import type { Message } from "@/types/message.type";

const TITLE_TURN_LENGTH = 2000;

export default async function generateTitle(
	messages: Message[],
	previousTitle: string,
	signal: AbortSignal,
): Promise<string | null> {
	const isFirstExchange = previousTitle.trim().length === 0;
	const pick = isFirstExchange ? "first" : "last";
	const userTurn =
		pick === "first"
			? messages.find((m) => m.role === "user" && m.content.trim().length > 0)
			: messages.findLast(
					(m) => m.role === "user" && m.content.trim().length > 0,
				);
	const assistantTurn =
		pick === "first"
			? messages.find(
					(m) => m.role === "assistant" && m.content.trim().length > 0,
				)
			: messages.findLast(
					(m) => m.role === "assistant" && m.content.trim().length > 0,
				);

	if (!userTurn || !assistantTurn) return null;

	const payload = {
		title: previousTitle,
		userMessage: userTurn.content.trim().slice(0, TITLE_TURN_LENGTH),
		assistantResponse: assistantTurn.content.trim().slice(0, TITLE_TURN_LENGTH),
	};

	try {
		const response = await fetch("/api/llm/title", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal,
		});
		if (!response.ok) return null;
		const data = (await response.json()) as { title?: unknown };
		return typeof data.title === "string" ? data.title : null;
	} catch (error) {
		const isAbort =
			error instanceof DOMException && error.name === "AbortError";
		if (!isAbort) {
			console.error("Failed to generate conversation title:", error);
		}
		return null;
	}
}
