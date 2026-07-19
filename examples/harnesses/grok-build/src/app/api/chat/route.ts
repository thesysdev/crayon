import {
  formatGrokBuildError,
  GrokBuildBusyError,
  isGrokBuildThreadBusy,
  runGrokBuildTurn,
} from "@/lib/grok-build-acp";
import { GrokBuildAGUIBridge } from "@/lib/grok-build-stream";
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
const TOOL_TRANSITION_MS = 24;

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
  const user = [...(messages ?? [])].reverse().find((message) => message.role === "user");
  return user ? messageText(user).trim() : "";
}

function sse(event: AGUIEvent | "[DONE]"): Uint8Array {
  return encoder.encode(
    event === "[DONE]" ? "data: [DONE]\n\n" : `data: ${JSON.stringify(event)}\n\n`,
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ChatBody;
  const messages = body.messages ?? [];
  const conversationId = body.threadId?.trim() || crypto.randomUUID();
  const prompt = latestUserText(messages);

  if (!prompt) {
    return Response.json({ error: "No user message was provided." }, { status: 400 });
  }
  if (isGrokBuildThreadBusy(conversationId)) {
    return Response.json(
      { error: "Grok Build is still responding to your previous message." },
      { status: 409 },
    );
  }

  const bridge = new GrokBuildAGUIBridge();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let pending = Promise.resolve();
      const enqueue = (event: AGUIEvent | "[DONE]") => {
        if (closed) return;
        try {
          controller.enqueue(sse(event));
        } catch {
          closed = true;
        }
      };
      const queueEvents = (events: AGUIEvent[]): Promise<void> => {
        pending = pending.then(async () => {
          for (const event of events) {
            if (closed) return;
            enqueue(event);
            if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
              await pause(STREAM_FRAME_MS);
            } else if (event.type === EventType.TOOL_CALL_RESULT) {
              // Give the completed card a paint before the next lifecycle starts.
              await pause(TOOL_TRANSITION_MS);
            }
          }
        });
        return pending;
      };
      const finish = async () => {
        if (closed) return;
        await queueEvents(bridge.finish());
        if (closed) return;
        enqueue("[DONE]");
        closed = true;
        try {
          controller.close();
        } catch {
          // The browser may already have closed the stream.
        }
      };

      const onUpdate: Parameters<typeof runGrokBuildTurn>[0]["onUpdate"] = (update) => {
        void queueEvents(bridge.consume(update));
      };

      void (async () => {
        try {
          await runGrokBuildTurn({
            sessionId: conversationId,
            prompt,
            hasHistory: messages.some((message) => message.role === "assistant"),
            signal: request.signal,
            onUpdate,
          });

          // One bounded parser-guided repair. It is an internal continuation of
          // the same Grok session and explicitly forbids additional tool calls.
          if (bridge.needsCorrection() && !request.signal.aborted) {
            const correctionPrompt = bridge.correctionPrompt();
            await queueEvents(bridge.beginCorrection());
            await runGrokBuildTurn({
              sessionId: conversationId,
              prompt: correctionPrompt,
              hasHistory: true,
              signal: request.signal,
              onUpdate,
            });
          }
        } catch (error: unknown) {
          if (request.signal.aborted) {
            await queueEvents(bridge.fail("Turn cancelled."));
            return;
          }
          const message =
            error instanceof GrokBuildBusyError
              ? error.message
              : formatGrokBuildError(error);
          await queueEvents(bridge.fail(message));
          await queueEvents([{ type: EventType.RUN_ERROR, message } as AGUIEvent]);
        } finally {
          await finish();
        }
      })();
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
