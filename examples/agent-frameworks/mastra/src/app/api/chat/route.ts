import { MastraAgent } from "@ag-ui/mastra";
import { Agent } from "@mastra/core/agent";
import type { Message } from "@ag-ui/core";
import { generateSystemPrompt } from "@openuidev/thesys-server";
import { NextRequest } from "next/server";
import { getStockPrice, getWeather } from "@/tools";

const agent = new MastraAgent({
  agent: new Agent({
    id: "openui-agent",
    name: "OpenUI Agent",
    instructions: generateSystemPrompt({
      instructions:
        "You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.",
    }),
    // Mastra's OpenAI-compatible client → POST /v1/embed/chat/completions
    model: {
      id: "google/gemini-3.6-flash-free",
      apiKey: process.env.THESYS_API_KEY,
      url: "https://api.thesys.dev/v1/embed",
    },
    tools: { getWeather, getStockPrice },
  }),
  resourceId: "chat-user",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        };

        const subscription = agent
          .run({
            messages,
            threadId,
            runId: crypto.randomUUID(),
            tools: [],
            context: [],
          })
          .subscribe({
            next: (event) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            },
            complete: close,
            error: (error: Error) => {
              const msg = error.message;
              console.error("Mastra stream error:", error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
              close();
            },
          });

        req.signal.addEventListener("abort", () => {
          subscription.unsubscribe();
        });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown route error";
    console.error("Route error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
