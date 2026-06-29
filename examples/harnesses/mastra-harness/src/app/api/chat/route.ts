import { HarnessAGUIBridge } from "@/lib/harness-stream";
import { getOrCreateHarnessSession } from "@/lib/mastra-harness";
import type { AGUIEvent, Message } from "@openuidev/react-headless";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGUI = {
  RUN_ERROR: "RUN_ERROR",
  TEXT_MESSAGE_CONTENT: "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END: "TEXT_MESSAGE_END",
  TEXT_MESSAGE_START: "TEXT_MESSAGE_START",
} as const;

interface ChatBody {
  modeId?: string;
  threadId?: string;
  messages?: Message[];
}

const VALID_MODE_IDS = new Set(["assist", "brief"]);

function normalizeModeId(modeId: string | undefined): "assist" | "brief" | undefined {
  return VALID_MODE_IDS.has(modeId ?? "") ? (modeId as "assist" | "brief") : undefined;
}

function messageText(message: Pick<Message, "content">): string {
  const content = message.content as unknown;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text?: unknown }).text ?? "")
          : "",
      )
      .join("\n");
  }
  return "";
}

function latestUserText(messages: Message[] | undefined): string {
  const user = [...(messages ?? [])].reverse().find((m) => m.role === "user");
  return user ? messageText(user).trim() : "";
}

function sse(event: AGUIEvent | "[DONE]"): Uint8Array {
  const encoder = new TextEncoder();
  if (event === "[DONE]") return encoder.encode("data: [DONE]\n\n");
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function textEvent(messageId: string, delta: string): AGUIEvent {
  return { type: AGUI.TEXT_MESSAGE_CONTENT, messageId, delta } as AGUIEvent;
}

function textStreamResponse(content: string): Response {
  const messageId = crypto.randomUUID();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        sse({ type: AGUI.TEXT_MESSAGE_START, messageId, role: "assistant" } as AGUIEvent),
      );
      controller.enqueue(sse(textEvent(messageId, content)));
      controller.enqueue(sse({ type: AGUI.TEXT_MESSAGE_END, messageId } as AGUIEvent));
      controller.enqueue(sse("[DONE]"));
      controller.close();
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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const conversationId = body.threadId || crypto.randomUUID();
  const modeId = normalizeModeId(body.modeId);
  const userText = latestUserText(body.messages);

  if (!userText) {
    return textStreamResponse("_No user message was provided._");
  }

  let entry: Awaited<ReturnType<typeof getOrCreateHarnessSession>>;
  try {
    entry = await getOrCreateHarnessSession(conversationId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (entry.session.run.isRunning()) {
    return textStreamResponse("_Still responding to your previous message. Please wait._");
  }

  if (modeId && entry.session.mode.get() !== modeId) {
    await entry.session.mode.switch({ modeId });
  }

  const bridge = new HarnessAGUIBridge();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const enqueue = (event: AGUIEvent | "[DONE]") => {
        if (closed) return;
        try {
          controller.enqueue(sse(event));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        for (const event of bridge.finish()) enqueue(event);
        enqueue("[DONE]");
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const unsubscribe = entry.session.subscribe((event) => {
        for (const aguiEvent of bridge.consume(event)) enqueue(aguiEvent);
      });

      const onAbort = () => entry.session.abort();
      req.signal.addEventListener("abort", onAbort);

      void (async () => {
        try {
          await entry.session.sendMessage({ content: userText });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          enqueue({ type: AGUI.RUN_ERROR, message } as AGUIEvent);
        } finally {
          entry.lastUsed = Date.now();
          req.signal.removeEventListener("abort", onAbort);
          unsubscribe();
          finish();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-conversation-id": conversationId,
    },
  });
}
