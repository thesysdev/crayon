import {
  agUIAdapter,
  type ChatLLM,
  type ChatStorage,
  type Message,
} from "@openuidev/react-headless";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { eveEventsToAGUI } from "./eve-stream";
import {
  createThreadStore,
  getClientStorage,
  type KVStorage,
  type ThreadStore,
} from "./thread-store";

// Eve's native HTTP session protocol (same-origin, proxied by `withEve`):
//   POST /eve/v1/session            -> create a session, returns { sessionId, continuationToken }
//   POST /eve/v1/session/:id        -> deliver a follow-up turn (with continuationToken)
//   GET  /eve/v1/session/:id/stream -> resumable NDJSON event feed (?startIndex=N)
// We talk to it with plain fetch rather than `eve/client` because the client
// barrel pulls Node-only modules into the browser bundle. The serializable
// SessionState cursor is the same shape `eve/client` exposes, persisted per
// thread so reopening a thread resumes the same Eve conversation.
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

const sessionKey = (threadId: string) => `eve-openui:session:${threadId}`;

function loadSession(storage: KVStorage, threadId: string): SessionState {
  try {
    const raw = storage.getItem(sessionKey(threadId));
    if (raw) return JSON.parse(raw) as SessionState;
  } catch {
    // fall through to a fresh cursor
  }
  return { streamIndex: 0 };
}

function saveSession(storage: KVStorage, threadId: string, state: SessionState): void {
  storage.setItem(sessionKey(threadId), JSON.stringify(state));
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

/**
 * Delivers one user turn to the Eve agent and tails just that turn's events,
 * advancing the session cursor via `onState` when the turn closes.
 */
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

  // Resume the cursor only when the server kept the same session.
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
    // `session.completed` ends the conversation; `waiting`/`failed` stay resumable.
    onState(completed ? { streamIndex: 0 } : { sessionId, continuationToken, streamIndex: index });
  }
}

/**
 * Wires OpenUI's chat surface to an Eve agent over Eve's native session
 * protocol. Returns the `llm` + `storage` adapters `<AgentInterface>` expects:
 * `llm.send` delivers the latest user turn and maps Eve's events to AG-UI, while
 * `storage.thread` persists the session cursor + transcript per thread.
 */
export function createEveChatProps(
  storage: KVStorage = getClientStorage(),
  store: ThreadStore = createThreadStore(storage),
): { llm: ChatLLM; storage: ChatStorage } {
  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    store.saveMessages(threadId, messages);

    let nextSession = loadSession(storage, threadId);
    const turn = runTurn(nextSession, latestUserText(messages), signal, (state) => {
      nextSession = state;
    });

    const encoder = new TextEncoder();
    let assistant = "";

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of eveEventsToAGUI(turn)) {
            if (event.type === "TEXT_MESSAGE_CONTENT") {
              assistant += (event as { delta: string }).delta;
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "RUN_ERROR", message })}\n\n`),
          );
        } finally {
          saveSession(storage, threadId, nextSession);
          if (assistant) {
            store.saveMessages(threadId, [
              ...messages,
              { id: crypto.randomUUID(), role: "assistant", content: assistant } as Message,
            ]);
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(body, { headers: { "content-type": "text/event-stream" } });
  };

  return {
    llm: { send, streamProtocol: agUIAdapter() },
    storage: {
      thread: {
        listThreads: () => store.fetchThreadList(),
        createThread: (firstMessage) => store.createThread(firstMessage),
        getMessages: (threadId) => store.loadThread(threadId),
        updateThread: (thread) => store.updateThread(thread),
        deleteThread: (id) => store.deleteThread(id),
      },
    },
  };
}
