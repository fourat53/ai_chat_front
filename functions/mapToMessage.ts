import type { ChatRole, Message } from "@/types/message.type";

export default function mapToMessage(msg: Message): Message {
	const fromParts = Array.isArray(msg.parts)
		? msg.parts
				.filter((p) => p.type === "text")
				.map((p) => (p.type === "text" ? p.text : ""))
				.join("")
		: "";
	const legacyContent = (msg as { content?: string }).content ?? "";
	return {
		id: msg.id,
		role: msg.role as ChatRole,
		parts: msg.parts,
		content: fromParts || legacyContent,
	};
}
