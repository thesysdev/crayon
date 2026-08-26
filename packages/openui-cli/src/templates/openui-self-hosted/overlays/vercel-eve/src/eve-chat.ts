import { agUIAdapter, type ChatLLM, type Message } from "@openuidev/react-ui";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { eveEventsToAGUI } from "./eve-stream";

// Eve's native HTTP session protocol (same-origin, proxied by `withEve`):
//   POST /eve/v1/session            -> create a session
//   POST /eve/v1/session/:id        -> deliver a follow-up turn
//   GET  /eve/v1/session/:id/stream -> resumable NDJSON event feed
const EVE_PREFIX = "/eve/v1";
const SESSION_ID_HEADER = "x-eve-session-id";

const isTurnBoundary = (event: HandleMessageStreamEvent): boolean =>
  event.type === "session.completed" ||
  event.type === "session.failed" ||
  event.type === "session.waiting";

function messageText(message: Pick<Message, "content">): string {
  const content = message.content as unknown;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part ? String(part.text ?? "") : "",
      )
      .join("\n");
  }
  return "";
}

function latestUserText(messages: Message[]): string {
  const user = [...messages].reverse().find((m) => m.role === "user");
  return user ? messageText(user).trim() : "";
}

async function* readNdjson(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<HandleMessageStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line) as HandleMessageStreamEvent;
      }
    }
    if (buffer.trim()) yield JSON.parse(buffer) as HandleMessageStreamEvent;
  } finally {
    reader.releaseLock();
  }
}

async function* runTurn(
  state: SessionState,
  message: string,
  signal: AbortSignal,
  onState: (next: SessionState) => void,
): AsyncIterable<HandleMessageStreamEvent> {
  const deliverPath = state.sessionId
    ? `${EVE_PREFIX}/session/${encodeURIComponent(state.sessionId)}`
    : `${EVE_PREFIX}/session`;
  const deliverBody: Record<string, unknown> = { message };
  if (state.sessionId && state.continuationToken) {
    deliverBody.continuationToken = state.continuationToken;
  }

  const delivered = await fetch(deliverPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(deliverBody),
    signal,
  });
  if (!delivered.ok) {
    throw new Error(`Eve session POST failed (${delivered.status}): ${await delivered.text()}`);
  }

  const meta = (await delivered.json().catch(() => ({}))) as {
    sessionId?: string;
    continuationToken?: string;
  };
  const sessionId =
    meta.sessionId ?? delivered.headers.get(SESSION_ID_HEADER)?.trim() ?? state.sessionId;
  if (!sessionId) throw new Error("Eve did not return a session id.");
  const continuationToken = meta.continuationToken ?? state.continuationToken;

  let index = state.sessionId === sessionId ? state.streamIndex : 0;
  const streamPath =
    `${EVE_PREFIX}/session/${encodeURIComponent(sessionId)}/stream` +
    (index > 0 ? `?startIndex=${index}` : "");

  const streamed = await fetch(streamPath, { signal });
  if (!streamed.ok || !streamed.body) {
    throw new Error(`Eve session stream GET failed (${streamed.status}).`);
  }

  let completed = false;
  try {
    for await (const event of readNdjson(streamed.body)) {
      index += 1;
      yield event;
      if (isTurnBoundary(event)) {
        completed = event.type === "session.completed";
        break;
      }
    }
  } finally {
    onState(completed ? { streamIndex: 0 } : { sessionId, continuationToken, streamIndex: index });
  }
}

/**
 * Client-side ChatLLM for Eve. OpenUI keeps the transcript in memory for the
 * page session; this adapter maps the current turn onto Eve's session protocol
 * and holds the per-thread Eve cursor in memory so follow-ups resume.
 */
export function createEveLLM(): ChatLLM {
  const sessions = new Map<string, SessionState>();

  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    let nextSession = sessions.get(threadId) ?? { streamIndex: 0 };
    const turn = runTurn(nextSession, latestUserText(messages), signal, (state) => {
      nextSession = state;
    });

    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of eveEventsToAGUI(turn)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "RUN_ERROR", message })}\n\n`),
          );
        } finally {
          sessions.set(threadId, nextSession);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(body, { headers: { "content-type": "text/event-stream" } });
  };

  return { send, streamProtocol: agUIAdapter() };
}
