import { UTApi } from "uploadthing/server";

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
		const { key } = (await req.json()) as { key?: string };

		if (typeof key !== "string" || !key.trim()) {
			return new Response(JSON.stringify({ error: "key is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const result = await new UTApi().deleteFiles(key, { keyType: "fileKey" });
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("UploadThing delete error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to delete file from storage",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
