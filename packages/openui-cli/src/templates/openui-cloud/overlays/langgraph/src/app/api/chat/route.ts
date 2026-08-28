import { graph } from "@/agent/agent";
import { resolveRequestedModel } from "@/lib/models";

export const runtime = "nodejs";

interface LangChainRequestMessage {
  type?: unknown;
  content?: unknown;
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

/**
 * Runs the LangGraph agent from src/agent/agent.ts in-process and returns its
 * native `messages`-mode SSE stream untransformed. The browser converts
 * outgoing messages with `langGraphMessageFormat` and parses the stream with
 * `langGraphAdapter()`, so no conversion happens here. OpenUI Cloud stores
 * prior turns, so only the newest human message is sent as graph input.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }
  const requestBody = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  const messages = requestBody.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }
  const last = messages[messages.length - 1] as LangChainRequestMessage;
  if (last?.type !== "human") {
    return badRequest("Expected the latest message to be a human message");
  }

  const conversationId = requestBody.threadId;
  if (typeof conversationId !== "string" || !conversationId) {
    return badRequest("threadId is required — create the conversation first");
  }

  const model = resolveRequestedModel(requestBody.model);
  if (!model) return badRequest("model is not available in this agent");

  const stream = await graph.stream(
    { messages: [{ type: "human", content: last.content as string }], conversationId, model },
    { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
