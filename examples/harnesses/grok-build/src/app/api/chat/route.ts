import { GrokBuildBusyError, isGrokBuildThreadBusy, runGrokBuildTurn } from "@/lib/grok-build-acp";
import { GrokBuildAGUIBridge } from "@/lib/grok-build-stream";
import { createOpenUIStatus } from "@/lib/openui-output";
import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { Message } from "@openuidev/react-headless";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  messages?: Message[];
  threadId?: string;
}

const encoder = new TextEncoder();
const STREAM_FRAME_MS = 16;

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
  const user = [...(messages ?? [])].reverse().find((message) => message.role === "user");
  return user ? messageText(user).trim() : "";
}

function sse(event: AGUIEvent | "[DONE]"): Uint8Array {
  return encoder.encode(
    event === "[DONE]" ? "data: [DONE]\n\n" : `data: ${JSON.stringify(event)}\n\n`,
  );
}

function textStreamResponse(content: string): Response {
  const messageId = crypto.randomUUID();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        sse({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" } as AGUIEvent),
      );
      controller.enqueue(
        sse({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: content } as AGUIEvent),
      );
      controller.enqueue(sse({ type: EventType.TEXT_MESSAGE_END, messageId } as AGUIEvent));
      controller.enqueue(sse("[DONE]"));
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ChatBody;
  const messages = body.messages ?? [];
  const conversationId = body.threadId?.trim() || crypto.randomUUID();
  const prompt = latestUserText(messages);

  if (!prompt) {
    return textStreamResponse(
      createOpenUIStatus("warning", "No message", "No user message was provided."),
    );
  }
  if (isGrokBuildThreadBusy(conversationId)) {
    return textStreamResponse(
      createOpenUIStatus(
        "info",
        "Still working",
        "Grok Build is still responding to your previous message. Please wait.",
      ),
    );
  }

  const bridge = new GrokBuildAGUIBridge();
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
      const finish = async () => {
        if (closed) return;
        for (const event of bridge.finish()) {
          enqueue(event);
          if (closed) return;
          if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
            await new Promise<void>((resolve) => setTimeout(resolve, STREAM_FRAME_MS));
          }
        }
        enqueue("[DONE]");
        closed = true;
        try {
          controller.close();
        } catch {
          // The browser may already have closed the stream.
        }
      };

      void runGrokBuildTurn({
        sessionId: conversationId,
        prompt,
        hasHistory: messages.some((message) => message.role === "assistant"),
        signal: request.signal,
        onUpdate: (update) => {
          for (const event of bridge.consume(update)) enqueue(event);
        },
      })
        .catch((error: unknown) => {
          if (request.signal.aborted) {
            bridge.fail("Turn cancelled.");
            return;
          }
          const message =
            error instanceof GrokBuildBusyError
              ? error.message
              : error instanceof Error
                ? error.message
                : String(error);
          for (const event of bridge.fail(message)) enqueue(event);
          enqueue({ type: EventType.RUN_ERROR, message } as AGUIEvent);
        })
        .finally(finish);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "x-conversation-id": conversationId,
    },
  });
}
