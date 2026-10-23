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
	try {
		const { index_id: indexId } = (await req.json()) as {
			index_id?: string;
		};

		if (!indexId?.trim()) {
			return new Response(JSON.stringify({ error: "index_id is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const response = await fetch(`${process.env.RAG_URL}/rag/delete`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ index_id: indexId }),
		});

		const text = await response.text();
		return new Response(text, {
			status: response.status,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("RAG delete error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to delete document",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
}
