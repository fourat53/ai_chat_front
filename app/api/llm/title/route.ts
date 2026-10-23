import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProviderModel } from "@/models/provider.model";
import type { Provider } from "@/types/provider.type";

export const runtime = "nodejs";

type TitleTurn = { role: "user" | "assistant"; content: string };

const TITLE_TURN_LENGTH = 2000;
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

function buildTitleInstruction(): string {
	return "You are naming a chat conversation from the user's first request. The user's message is given in the conversation history. Write a very short title that captures what the user is asking about or wants to accomplish. Do not simply quote or repeat the user's message, and ignore greetings and small talk. Reply in the same language as the user's message, with the title text only, without quotes or a closing period.";
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
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const parsed = (body ?? {}) as {
		userMessage?: unknown;
	};
	const userMessage =
		typeof parsed.userMessage === "string" ? parsed.userMessage.trim() : "";

	if (!userMessage) {
		return NextResponse.json(
			{ error: "userMessage is required" },
			{ status: 400 },
		);
	}

	const turns: TitleTurn[] = [
		{ role: "user", content: userMessage.slice(0, TITLE_TURN_LENGTH) },
	];

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
					question: buildTitleInstruction(),
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
