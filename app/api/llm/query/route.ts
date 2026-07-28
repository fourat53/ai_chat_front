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
    const body = await req.json();
    const { messages, provider, model, question: directQuestion } = body;

    const lastUserMessage = Array.isArray(messages)
      ? [...messages].reverse().find((m) => m?.role === "user")
      : undefined;

    const questionFromParts =
      lastUserMessage?.parts && Array.isArray(lastUserMessage.parts)
        ? lastUserMessage.parts
            .filter((p: { type?: string }) => p?.type === "text")
            .map((p: { text?: string }) => p?.text ?? "")
            .join("")
        : "";

    const question =
      directQuestion || questionFromParts || lastUserMessage?.content || "";

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
        body: JSON.stringify({ provider, model, question }),
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
