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
				return new Response(await searchResponse.text(), {
					status: searchResponse.status,
					headers: { "Content-Type": "application/json" },
				});
			}

			return new Response(await searchResponse.text(), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
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
