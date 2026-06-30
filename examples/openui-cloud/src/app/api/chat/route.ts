import { envOr, openuiCloudBaseUrl, requiredEnv } from "@/lib/env";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import type { ResponseInputItem } from "openai/resources/responses/responses";

/**
 * Generation plane: browser → THIS route → OpenUI Cloud
 * POST /v1/embed/responses with the org MASTER key (server env only).
 * Reads/edits go browser → /v1/* with the fct_ token instead (see
 * /api/frontend-token + the storage adapter). The artifact tool runs
 * server-side, so this route is a pure pipe — no client-tool loop.
 */
export async function POST(req: Request) {
  const { threadId, input } = (await req.json()) as {
    threadId?: string;
    input?: ResponseInputItem[];
  };

  // The conversation must already exist — the API replays history from it and
  // stamps ownership on persist. The chat store creates the thread before the
  // first send.
  if (!threadId) {
    return Response.json(
      { error: { message: "threadId is required — create the conversation first" } },
      { status: 400 },
    );
  }
  if (!Array.isArray(input) || input.length === 0) {
    return Response.json(
      { error: { message: "input must be a non-empty ResponseInputItem[]" } },
      { status: 400 },
    );
  }
  console.log("artifactTool", artifactTool());
  const upstream = await fetch(`${openuiCloudBaseUrl()}/v1/embed/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requiredEnv("THESYS_API_KEY")}`,
    },
    body: JSON.stringify({
      // A bare provider/model id (versioned managed ids are mutually
      // exclusive with the instructions config block). Configurable via
      // OPENUI_MODEL (.env.local); defaults to openai/gpt-5.
      model: envOr("OPENUI_MODEL", "openai/gpt-5"),
      conversation: threadId,
      input,
      stream: true,
      store: true,
      tools: [artifactTool()],
      instructions: createResponsesInstructions(),
    }),
    signal: req.signal, // propagate browser aborts (stop button / tab close)
  });

  if (!upstream.ok || !upstream.body) {
    // Forward the upstream error body verbatim (OpenAI-shaped JSON).
    const detail = await upstream.text().catch(() => "");
    return new Response(detail || JSON.stringify({ error: { message: "upstream error" } }), {
      status: upstream.status || 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pipe the SSE byte stream through untouched.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
