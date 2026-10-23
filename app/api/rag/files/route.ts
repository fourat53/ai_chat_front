export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_TIMEOUT_MS = 15000;

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
	try {
		const { question, ragFiles: ragFilesRaw } = (await req.json()) as {
			question?: string;
			ragFiles?: unknown[];
		};

		if (typeof question !== "string" || !question.trim()) {
			return new Response(JSON.stringify({ error: "No question provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const ragFiles = Array.isArray(ragFilesRaw)
			? (ragFilesRaw as unknown[]).filter(
					(f): f is { indexId: string; fileName?: string } =>
						!!f &&
						typeof f === "object" &&
						typeof (f as { indexId?: unknown }).indexId === "string",
				)
			: [];

		if (ragFiles.length === 0) {
			return new Response(
				JSON.stringify({
					error: "At least one ragFile with an indexId is required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

		try {
			const searchResponse = await fetch(`${process.env.RAG_URL}/rag/search`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: question,
					top_k: 5,
					index_ids: ragFiles.map((f) => f.indexId),
				}),
				signal: controller.signal,
			});
			clearTimeout(timeout);

			if (!searchResponse.ok) {
				console.error(
					"RAG search error:",
					searchResponse.status,
					await searchResponse.text(),
				);
				return new Response(JSON.stringify({ error: "RAG search failed" }), {
					status: 502,
					headers: { "Content-Type": "application/json" },
				});
			}

			const searchData = (await searchResponse.json()) as {
				chunks?: { content?: string }[];
			};
			const chunks = (searchData.chunks ?? [])
				.map((chunk) => chunk?.content ?? "")
				.filter(Boolean);

			let questionWithContext = question;
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

			return new Response(
				JSON.stringify({
					questionWithContext,
					chunkCount: chunks.length,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (fetchError) {
			clearTimeout(timeout);
			if (fetchError instanceof Error && fetchError.name === "AbortError") {
				return new Response(JSON.stringify({ error: "Request timeout" }), {
					status: 504,
					headers: { "Content-Type": "application/json" },
				});
			}
			console.error("RAG search fetch failed:", fetchError);
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
		console.error("RAG files error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to retrieve document context",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
