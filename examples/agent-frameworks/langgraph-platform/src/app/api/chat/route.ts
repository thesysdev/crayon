import { agUiTextCollector, messageText, storeTurn } from "@/lib/chat-history";
import { createLangChainStreamResponse } from "@openuidev/langchain";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Local LangGraph server configuration defined via langgraph.json
 */
const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const ASSISTANT_ID = process.env.LANGGRAPH_ASSISTANT_ID || "agent";

type ChatBody = {
  threadId?: string;
  messages?: { role?: string; content?: unknown }[];
};

/**
 * Proxies the browser <-> LangGraph server. The browser posts native AG-UI
 * messages; {@link createLangChainStreamResponse} converts them to LangChain
 * messages, starts the graph over the protocol-v2 endpoints, and relays only
 * the custom OpenUI channel.
 *
 * The graph runs stateless, so the reply is read off the relayed events and
 * stored in the thread's Cloud conversation before the stream ends.
 */
export async function POST(req: NextRequest) {
  const { threadId, messages } = (await req.clone().json()) as ChatBody;
  const question = messages?.at(-1);

  const response = await createLangChainStreamResponse(req, {
    apiUrl: API_URL,
    assistantId: ASSISTANT_ID,
    apiKey: process.env.LANGSMITH_API_KEY,
    debug: process.env.NODE_ENV !== "production",
  });
  if (!response.ok || !response.body || question?.role !== "user") return response;

  const reply = agUiTextCollector();
  const decoder = new TextDecoder();
  let buffered = "";
  const readEvents = (text: string) => {
    buffered += text;
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        reply.add(JSON.parse(line.slice(5)));
      } catch {
        // Not JSON, e.g. [DONE].
      }
    }
  };

  const body = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        readEvents(decoder.decode(chunk, { stream: true }));
        controller.enqueue(chunk);
      },
      async flush() {
        readEvents(decoder.decode() + "\n");
        await storeTurn(threadId, messageText(question.content), reply.segments);
      },
    }),
  );
  return new Response(body, { status: response.status, headers: response.headers });
}
