import { textOf } from "@/client/message.client";
import { resolveUserApiKey } from "@/lib/api-keys/user-key";
import { getUserIdOrNull } from "@/lib/auth/session";
import type { Message } from "@/types/message.type";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryTurn = { role: "user" | "assistant"; content: string };

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

		if (!question.trim()) {
			return new Response(JSON.stringify({ error: "No question provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const userId = await getUserIdOrNull();
		const userApiKey =
			typeof provider === "string"
				? await resolveUserApiKey(userId, provider)
				: null;

		const endpoint = ragFiles.length > 0 ? "/rag/query" : "/llm/query";

		const payload: {
			provider: unknown;
			model: unknown;
			question: string;
			history: HistoryTurn[];
			base_url: unknown;
			api_key: string | null;
			index_ids?: string[];
			document_names?: string[];
		} = {
			provider,
			model,
			question,
			history,
			base_url: baseUrl,
			api_key: userApiKey,
		};
		if (ragFiles.length > 0) {
			payload.index_ids = ragFiles.map((f) => f.indexId);
			const documentNames = [
				...new Set(
					ragFiles
						.map((f) => f.fileName)
						.filter((name): name is string => Boolean(name)),
				),
			];
			if (documentNames.length > 0) {
				payload.document_names = documentNames;
			}
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 60000);

		try {
			const response = await fetch(`${process.env.RAG_URL}${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				return new Response(await response.text(), {
					status: response.status,
					headers: { "Content-Type": "application/json" },
				});
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
			console.error("RAG service fetch failed:", fetchError);
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
