import { agUiTextCollector, messageText, storeTurn } from "@/lib/chat-history";
import { openuiAgent } from "@/mastra";
import type { Message } from "@ag-ui/core";
import { MastraAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";

const agent = new MastraAgent({
  agent: openuiAgent,
  resourceId: "chat-user",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: Message[]; threadId: string } = await req.json();
    const encoder = new TextEncoder();
    const question = messages.at(-1);
    const reply = agUiTextCollector();

    const readable = new ReadableStream({
      start(controller) {
        let closed = false;
        const close = async () => {
          if (closed) return;
          closed = true;
          if (question?.role === "user") {
            await storeTurn(threadId, messageText(question.content), reply.segments);
          }
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
              reply.add(event);
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
