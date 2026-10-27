import type { Message } from "@/types/message.type";

function mapToMessage(msg: Message): Message {
	const fromParts = Array.isArray(msg.parts)
		? msg.parts
				.filter((p) => p.type === "text")
				.map((p) => (p.type === "text" ? p.text : ""))
				.join("")
		: "";
	const legacyContent = (msg as { content?: string }).content ?? "";
	return {
		...msg,
		content: fromParts || legacyContent,
	};
}

function textOf(m: Message): string {
	const msg = m as {
		parts?: { type?: string; text?: string }[];
		content?: string;
	};
	if (Array.isArray(msg?.parts)) {
		return msg.parts
			.filter((p) => p?.type === "text")
			.map((p) => p?.text ?? "")
			.join("");
	}
	return msg?.content ?? "";
}

export { mapToMessage, textOf };
