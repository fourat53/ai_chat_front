export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INGEST_TIMEOUT_MS = 300000;
const UPLOADTHING_HOST_SUFFIXES = [".ufs.sh", ".utfs.io", "uploadthing.com"];

function isAllowedFileUrl(rawUrl: string): boolean {
	try {
		const url = new URL(rawUrl);
		if (url.protocol !== "http:" && url.protocol !== "https:") return false;
		const host = url.hostname.toLowerCase();
		return UPLOADTHING_HOST_SUFFIXES.some(
			(suffix) => host === suffix.slice(1) || host.endsWith(suffix),
		);
	} catch {
		return false;
	}
}

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
		const {
			url,
			filename,
			index_id: indexId,
		} = (await req.json()) as {
			url?: string;
			filename?: string;
			index_id?: string;
		};

		if (!url || !isAllowedFileUrl(url)) {
			return new Response(JSON.stringify({ error: "Invalid file url" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (typeof indexId !== "string" || !indexId.trim()) {
			return new Response(JSON.stringify({ error: "Missing index_id field" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (typeof filename === "string" && filename.length > 255) {
			return new Response(JSON.stringify({ error: "Invalid filename" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), INGEST_TIMEOUT_MS);

		try {
			const response = await fetch(`${process.env.RAG_URL}/rag/upload`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					url,
					filename: typeof filename === "string" ? filename : undefined,
					index_id: indexId,
				}),
				signal: controller.signal,
			});
			clearTimeout(timeout);

			const text = await response.text();
			return new Response(text, {
				status: response.status,
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
			console.error("RAG ingest fetch failed:", fetchError);
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
		console.error("RAG ingest error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to index document",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
