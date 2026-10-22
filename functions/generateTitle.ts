import type { Message } from "@/types/message.type";

const TITLE_MESSAGE_LENGTH = 2000;

export default async function generateTitle(
	messages: Message[],
	signal: AbortSignal,
): Promise<string | null> {
	const firstUserMessage = messages.find(
		(m) => m.role === "user" && m.content.trim().length > 0,
	);
	if (!firstUserMessage) return null;

	const payload = {
		userMessage: firstUserMessage.content.trim().slice(0, TITLE_MESSAGE_LENGTH),
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
