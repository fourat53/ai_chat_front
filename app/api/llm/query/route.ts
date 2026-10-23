export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

export async function POST(req: Request) {
	type HistoryTurn = { role: "user" | "assistant"; content: string };

	const textOf = (m: unknown): string => {
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
	};

	try {
		const body = await req.json();
		const {
			messages,
			provider,
			model,
			question: directQuestion,
			baseUrl,
			ragFiles: ragFilesRaw,
		} = body;

		const turns: HistoryTurn[] = Array.isArray(messages)
			? messages.flatMap((m: unknown) => {
					const role = (m as { role?: string })?.role;
					const content = textOf(m);
					if (role !== "user" && role !== "assistant") return [];
					if (!content) return [];
					return [{ role, content }];
				})
			: [];

		const lastUserIndex = turns.reduce<number>(
			(acc, turn, i) => (turn.role === "user" ? i : acc),
			-1,
		);

		const question =
			directQuestion ??
			(lastUserIndex >= 0 ? (turns[lastUserIndex]?.content ?? "") : "");
		const history = lastUserIndex >= 0 ? turns.slice(0, lastUserIndex) : [];

		if (!question) {
			return new Response(JSON.stringify({ error: "No question provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!provider || !model) {
			return new Response(
				JSON.stringify({ error: "Provider and model are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!process.env.RAG_URL) {
			return new Response(
				JSON.stringify({
					error: "RAG service URL is not configured",
					details: "Set RAG_URL in the Next.js environment",
				}),
				{ status: 502, headers: { "Content-Type": "application/json" } },
			);
		}

		const ragFiles = Array.isArray(ragFilesRaw)
			? (ragFilesRaw as unknown[]).filter(
					(f): f is { indexId: string; fileName?: string } =>
						!!f &&
						typeof f === "object" &&
						typeof (f as { indexId?: unknown }).indexId === "string",
				)
			: [];

		let questionWithContext = question;
		if (ragFiles.length > 0) {
			try {
				const searchController = new AbortController();
				const searchTimeout = setTimeout(() => searchController.abort(), 15000);

				const searchResponse = await fetch(
					`${process.env.RAG_URL}/rag/search`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							query: question,
							top_k: 5,
							index_ids: ragFiles.map((f) => f.indexId),
						}),
						signal: searchController.signal,
					},
				);
				clearTimeout(searchTimeout);

				if (searchResponse.ok) {
					const searchData = (await searchResponse.json()) as {
						chunks?: { content?: string }[];
					};
					const chunks = (searchData.chunks ?? [])
						.map((chunk) => chunk?.content ?? "")
						.filter(Boolean);

					if (chunks.length > 0) {
						const documentNames = [
							...new Set(
								ragFiles
									.map((f) => f.fileName)
									.filter((name): name is string => Boolean(name)),
							),
						].join(", ");
						questionWithContext = [
							`You are answering based on the provided document context${documentNames ? ` (from: ${documentNames})` : ""}.`,
							"Answer using ONLY the information in the document context. Synthesize the relevant information across chunks into a clear, natural, human-like answer. Avoid lists, bullet points, markdown formatting, symbols, or emphasis markers.",
							'If the context does not contain the answer or any part of it, respond exactly with: "I do not have enough information to answer the question."',
							"",
							"Document context:",
							chunks.join("\n\n"),
							"",
							`Question: ${question}`,
						].join("\n");
					}
				} else {
					console.error(
						"RAG search error:",
						searchResponse.status,
						await searchResponse.text(),
					);
				}
			} catch (ragError) {
				console.error(
					"RAG retrieval failed, continuing without context:",
					ragError,
				);
			}
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 60000);

		try {
			const response = await fetch(`${process.env.RAG_URL}/llm/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider,
					model,
					question: questionWithContext,
					history,
					base_url: baseUrl,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Backend API error:", response.status, errorText);
				return new Response(
					JSON.stringify({ error: "Backend API error", details: errorText }),
					{
						status: response.status,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			return new Response(response.body, {
				status: 200,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Cache-Control": "no-cache",
					"X-Accel-Buffering": "no",
				},
			});
		} catch (fetchError) {
			clearTimeout(timeout);
			if (fetchError instanceof Error && fetchError.name === "AbortError") {
				return new Response(JSON.stringify({ error: "Request timeout" }), {
					status: 504,
					headers: { "Content-Type": "application/json" },
				});
			}
			console.error("RAG fetch failed:", fetchError);
			return new Response(
				JSON.stringify({
					error: "Could not reach RAG service",
					details:
						fetchError instanceof Error ? fetchError.message : "Unknown error",
				}),
				{ status: 502, headers: { "Content-Type": "application/json" } },
			);
		}
	} catch (error) {
		console.error("LLM query error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to query LLM",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
