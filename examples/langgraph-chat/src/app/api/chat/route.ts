import { Client } from "@langchain/langgraph-sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const ASSISTANT_ID = process.env.LANGGRAPH_ASSISTANT_ID || "agent";
const API_KEY = process.env.LANGSMITH_API_KEY;

// Graph nodes whose streamed tokens are internal (e.g. the supervisor's routing
// decision) and must not surface as assistant output in the chat.
const INTERNAL_NODES = new Set(["router"]);

interface LangGraphInputMessage {
  type: string;
  content?: unknown;
  tool_calls?: unknown;
  tool_call_id?: string;
  [key: string]: unknown;
}

/**
 * The browser stores the specialist's streamed tool call and final answer as
 * one assistant message, but it does not store the ToolNode result. Replaying
 * that partial tool transcript makes OpenAI reject the next request. Tool
 * execution belongs to the current graph run, so retain only visible chat
 * history between stateless runs.
 */
function stripInternalToolHistory(messages: LangGraphInputMessage[]): LangGraphInputMessage[] {
  return messages.flatMap((message) => {
    if (message.type === "tool") return [];
    if (message.type !== "ai" || !message.tool_calls) return [message];

    const visibleMessage = { ...message };
    delete visibleMessage.tool_calls;
    return [visibleMessage];
  });
}

/**
 * Proxies the browser <-> LangGraph server.
 *
 * The client posts messages already in LangChain format (see `page.tsx`,
 * which runs `langGraphMessageFormat.toApi`). We open a stateless streaming
 * run and forward the LangGraph server's Server-Sent Events to the browser,
 * where `langGraphAdapter()` parses them.
 *
 * Keeping the LangGraph connection here (rather than calling the server
 * directly from the browser) is what lets us attach the API key and keep the
 * deployment URL server-side.
 */
export async function POST(req: NextRequest) {
  const { messages = [] } = (await req.json()) as { messages?: LangGraphInputMessage[] };
  const visibleMessages = stripInternalToolHistory(messages);

  const client = new Client({ apiUrl: API_URL, apiKey: API_KEY });
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller already closed (client disconnected) — stop writing.
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      try {
        const run = client.runs.stream(null, ASSISTANT_ID, {
          input: { messages: visibleMessages },
          streamMode: ["messages-tuple", "updates"],
          signal: req.signal,
        });

        for await (const chunk of run) {
          const raw = chunk.event ?? "";

          if (raw.startsWith("messages")) {
            // Token tuples arrive as [messageChunk, metadata]. Drop tokens from
            // internal nodes (the supervisor) so only specialist output renders,
            // and normalize the event name to what langGraphAdapter() expects.
            const meta = Array.isArray(chunk.data)
              ? (chunk.data[1] as { langgraph_node?: string } | undefined)
              : undefined;
            if (meta?.langgraph_node && INTERNAL_NODES.has(meta.langgraph_node)) continue;
            send("messages", chunk.data);
            continue;
          }

          send(raw, chunk.data);
        }

        send("end", null);
      } catch (err) {
        // A client disconnect aborts the upstream run — that's not an error.
        if (!req.signal.aborted) {
          const message = err instanceof Error ? err.message : "LangGraph stream error";
          console.error("LangGraph route error:", message);
          send("error", { error: "StreamError", message });
        }
      } finally {
        close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
