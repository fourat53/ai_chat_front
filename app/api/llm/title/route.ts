import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProviderModel } from "@/models/provider.model";
import type { Provider } from "@/types/provider.type";

export const runtime = "nodejs";

type TitleTurn = { role: "user" | "assistant"; content: string };

const TITLE_INSTRUCTION =
	"Write a short title that summarizes this conversation. Reply with the title text only, without quotes or a closing period.";
const SUMMARY_PROVIDER_LABEL = "openrouter";
const AUTO_ROUTER_PATTERN = /auto[\s_-]*router/i;
const AUTO_ROUTER_MODEL_ID = "openrouter/auto";
const TITLE_MAX_LENGTH = 64;
const FAILURE_TEXT_PATTERN = /model request failed/i;

function isAutoRouterModel(model: {
	id?: string | null;
	name?: string | null;
}) {
	return (
		model.id === AUTO_ROUTER_MODEL_ID ||
		AUTO_ROUTER_PATTERN.test(model.id ?? "") ||
		AUTO_ROUTER_PATTERN.test(model.name ?? "")
	);
}

function formatTitle(raw: string): string {
	const singleLine = raw
		.replace(/[\r\n]+/g, " ")
		.replace(/^[\s"'`*]+/, "")
		.replace(/[\s"'`*]+$/, "")
		.replace(/\.+$/, "")
		.replace(/\s+/g, " ")
		.trim();
	if (!singleLine) return "";
	if (singleLine.length <= TITLE_MAX_LENGTH) return singleLine;
	return `${singleLine.slice(0, TITLE_MAX_LENGTH - 3).trimEnd()}...`;
}

export async function POST(req: NextRequest) {
	let rawMessages: unknown;
	try {
		const body = await req.json();
		rawMessages = body.messages;
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const turns: TitleTurn[] = Array.isArray(rawMessages)
		? rawMessages
				.map((m: unknown) => {
					const msg = m as { role?: string; content?: string };
					return {
						role: msg?.role,
						content: msg?.content ?? "",
					};
				})
				.filter(
					(turn): turn is TitleTurn =>
						(turn.role === "user" || turn.role === "assistant") &&
						turn.content.trim().length > 0,
				)
		: [];

	if (turns.length === 0) {
		return NextResponse.json(
			{ error: "messages with content are required" },
			{ status: 400 },
		);
	}

	if (!process.env.RAG_URL) {
		return NextResponse.json(
			{
				error: "RAG service URL is not configured",
				details: "Set RAG_URL in the Next.js environment",
			},
			{ status: 502 },
		);
	}

	try {
		await connectDB();
		const summaryProvider = (await ProviderModel.findOne({
			label: SUMMARY_PROVIDER_LABEL,
		}).lean()) as unknown as (Provider & { _id?: unknown }) | null;

		if (!summaryProvider?.baseUrl) {
			return NextResponse.json(
				{ error: "Title summarizer provider is not configured" },
				{ status: 404 },
			);
		}

		const modelsResponse = await fetch(
			`${process.env.RAG_URL}/models/${encodeURIComponent(SUMMARY_PROVIDER_LABEL)}?base_url=${encodeURIComponent(summaryProvider.baseUrl)}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			},
		);
		if (!modelsResponse.ok) {
			return NextResponse.json(
				{ error: "Could not list summarizer models" },
				{ status: 502 },
			);
		}
		const modelsData = await modelsResponse.json();
		const models = (modelsData.models ?? []) as {
			id?: string;
			name?: string;
		}[];
		const summarizerModel =
			models.find(isAutoRouterModel) ?? models.find((m) => m.id);

		if (!summarizerModel?.id) {
			return NextResponse.json(
				{ error: "No summarizer model is available" },
				{ status: 502 },
			);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 60000);
		let queryResponse: Response;
		try {
			queryResponse = await fetch(`${process.env.RAG_URL}/llm/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: SUMMARY_PROVIDER_LABEL,
					model: summarizerModel.id,
					question: TITLE_INSTRUCTION,
					history: turns,
					base_url: summaryProvider.baseUrl,
				}),
				signal: controller.signal,
			});
		} finally {
			clearTimeout(timeout);
		}

		if (!queryResponse.ok) {
			const errorText = await queryResponse.text();
			console.error("Title summarizer error:", queryResponse.status, errorText);
			return NextResponse.json(
				{ error: "Could not reach summarizer" },
				{ status: 502 },
			);
		}

		const responseText = await queryResponse.text();
		if (FAILURE_TEXT_PATTERN.test(responseText)) {
			return NextResponse.json(
				{ error: "Summarizer failed upstream" },
				{ status: 502 },
			);
		}
		const title = formatTitle(responseText);
		if (!title) {
			return NextResponse.json({ error: "No title returned" }, { status: 502 });
		}
		return NextResponse.json({ title });
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return NextResponse.json({ error: "Request timeout" }, { status: 504 });
		}
		console.error("Title generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate conversation title",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
