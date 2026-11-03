import { type ChatTransport, TextStreamChatTransport } from "ai";
import { waitForIngest } from "@/client/file.client";
import type { ConvFile } from "@/types/file.type";
import type { Message } from "@/types/message.type";

type SendMessagesOptions = Parameters<
	ChatTransport<Message>["sendMessages"]
>[0];

type ChatRequestBody = { ragFiles?: ConvFile[] };

function ragFilesFromBody(body: unknown): ConvFile[] {
	if (typeof body !== "object" || body === null) return [];
	const { ragFiles } = body as Partial<ChatRequestBody>;
	return Array.isArray(ragFiles) ? ragFiles : [];
}

class DeferredRagTransport implements ChatTransport<Message> {
	constructor(private readonly transport: ChatTransport<Message>) {}

	async sendMessages(options: SendMessagesOptions) {
		const ragFiles = ragFilesFromBody(options.body);
		if (!ragFiles.length) return this.transport.sendMessages(options);

		const ingestResults = await Promise.all(
			ragFiles.map((file) => waitForIngest(file.indexId)),
		);
		if (options.abortSignal?.aborted)
			throw new DOMException("Aborted", "AbortError");
		const readyFiles = ragFiles.filter((_, index) => ingestResults[index]);
		if (!readyFiles.length) {
			throw new Error("The attached files could not be processed.");
		}
		return this.transport.sendMessages({
			...options,
			body: { ...options.body, ragFiles: readyFiles },
		});
	}

	reconnectToStream(
		options: Parameters<ChatTransport<Message>["reconnectToStream"]>[0],
	) {
		return this.transport.reconnectToStream(options);
	}
}

export function createChatTransport(): ChatTransport<Message> {
	return new DeferredRagTransport(
		new TextStreamChatTransport({ api: "/api/llm/query" }),
	);
}
