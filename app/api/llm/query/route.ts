import { textOf } from "@/client/message.client";
import type { Message } from "@/types/message.type";

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
			? messages.flatMap((m: Message) => {
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
				const ragResponse = await fetch(new URL("/api/rag/files", req.url), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ question, ragFiles }),
				});

				if (ragResponse.ok) {
					const ragData = (await ragResponse.json()) as {
						questionWithContext?: string;
					};
					if (ragData?.questionWithContext) {
						questionWithContext = ragData.questionWithContext;
					}
				} else {
					console.error(
						"RAG files API error:",
						ragResponse.status,
						await ragResponse.text(),
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
