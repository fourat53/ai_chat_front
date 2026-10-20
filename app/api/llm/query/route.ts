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

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 60000);

		try {
			const response = await fetch(`${process.env.RAG_URL}/llm/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider,
					model,
					question,
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
