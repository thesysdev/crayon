import { envOr, requiredEnv } from "@/lib/env";
import { DEFAULT_MODEL, resolveRequestedModel } from "@/lib/models";
import { artifactTool, createResponsesInstructions } from "@openuidev/thesys-server";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

/**
 * Generation plane: browser → THIS route → OpenUI Cloud
 * POST /v1/embed/responses with the org MASTER key (server env only).
 * Reads/edits go browser → /v1/* with the fct_ token instead (see
 * /api/frontend-token + the storage adapter). The artifact tool runs
 * server-side, so this route is a pure pipe — no client-tool loop.
 */
export async function POST(req: Request) {
  const {
    threadId,
    input,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    input?: ResponseInputItem[];
    model?: unknown;
  };

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

  const client = new OpenAI({
    // responses.create() POSTs to `${baseURL}/responses` → /v1/embed/responses.
    baseURL: `https://api.thesys.dev/v1/embed`,
    apiKey: requiredEnv("THESYS_API_KEY"), // sent as Authorization: Bearer …
  });

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      {
        model: resolveRequestedModel(requestedModel, envOr("OPENUI_MODEL", DEFAULT_MODEL)),
        conversation: threadId, // store:true persists to the conversation
        input,
        stream: true,
        store: true,
        // `artifacts` makes each entry carry library_version:'0.1.0' → openui-lang.
        // Bare artifactTool() would fall back to the legacy <artifact> XML model.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [
          artifactTool({ artifacts: ["slides", "report"] }),
          {
            type: "web_search",
          },
          {
            type: "image_search",
          },
          // Remote MCP runs inside OpenUI Cloud, so there's no client tool loop
          // to add: the stream just carries an `mcp_list_tools` item per fresh
          // server plus an `mcp_call` per invocation, which the adapter turns
          // into ordinary timeline tool calls. Declared per request — servers
          // never auto-attach. Point MCP_SERVER_URL at your own to swap it.
          {
            type: "mcp",
            server_label: envOr("MCP_SERVER_LABEL", "deepwiki"),
            server_url: envOr("MCP_SERVER_URL", "https://mcp.deepwiki.com/mcp"),
            ...(process.env["MCP_SERVER_TOKEN"]
              ? { headers: { Authorization: `Bearer ${process.env["MCP_SERVER_TOKEN"]}` } }
              : {}),
          },
        ],
        instructions: createResponsesInstructions(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { signal: req.signal }, // propagate browser aborts (stop button / tab close)
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    // The SDK surfaces upstream HTTP errors (e.g. 403) as APIError.
    const e = err as { status?: number; error?: unknown; message?: string };
    return Response.json(
      { error: e.error ?? { message: e.message ?? "upstream error" } },
      { status: e.status ?? 502 },
    );
  }

  // Re-emit each SDK event as SSE for the browser adapter.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
