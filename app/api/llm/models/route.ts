import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const providerId = searchParams.get("providerId");
	const baseUrl = searchParams.get("baseUrl");

	if (!providerId) {
		return NextResponse.json(
			{ error: "providerId is required" },
			{ status: 400 },
		);
	}

	if (!baseUrl) {
		return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
	}

	try {
		const response = await fetch(
			`${process.env.RAG_URL}/models/${encodeURIComponent(providerId)}?base_url=${encodeURIComponent(baseUrl)}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			},
		);

		if (!response.ok) {
			console.error(
				`Failed to fetch models for ${providerId}:`,
				response.statusText,
			);
			return NextResponse.json({ models: [] });
		}

		const data = await response.json();

		return NextResponse.json({ models: data.models || [] });
	} catch (error) {
		console.error(`Error fetching models for ${providerId}:`, error);
		return NextResponse.json({ models: [] });
	}
}
