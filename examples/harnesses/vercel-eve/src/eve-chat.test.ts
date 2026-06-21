import type { Message } from "@openuidev/react-headless";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEveChatProps } from "./eve-chat";
import { createMemoryStorage } from "./thread-store";

/**
 * These tests pin the one piece of non-trivial bridge logic: delivering a turn
 * over Eve's native two-step session protocol and resuming the event stream from
 * the per-thread cursor so each turn surfaces ONLY its own reply (no replay).
 *
 * A fake `fetch` stands in for the Eve agent, modelling the real wire contract:
 *   POST /eve/v1/session            -> create session, 202 { sessionId, continuationToken }
 *   POST /eve/v1/session/:id        -> deliver follow-up, 200 { sessionId, continuationToken }
 *   GET  /eve/v1/session/:id/stream -> NDJSON of the run's events from ?startIndex
 */

interface RecordedRequest {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

function eveEvents(reply: string, withSessionStart: boolean) {
  const events: Array<Record<string, unknown>> = [];
  if (withSessionStart) events.push({ type: "session.started", data: {} });
  events.push({ type: "turn.started", data: {} });
  events.push({ type: "message.received", data: {} });
  events.push({ type: "message.appended", data: { messageDelta: reply, stepIndex: 0 } });
  events.push({ type: "message.completed", data: { message: reply, stepIndex: 0 } });
  events.push({ type: "turn.completed", data: {} });
  events.push({ type: "session.waiting", data: {} });
  return events;
}

/** Echoes the first UPPER-123 style token in the delivered message back as a card. */
function replyFor(message: string): string {
  const token = message.match(/[A-Z]+-\d+/);
  return `root = Card([TextContent("${token ? token[0] : "OK"}")])`;
}

type TurnBuilder = (message: string, withSessionStart: boolean) => Array<Record<string, unknown>>;

const defaultTurn: TurnBuilder = (message, withSessionStart) =>
  eveEvents(replyFor(message), withSessionStart);

function createEveMock(buildTurn: TurnBuilder = defaultTurn) {
  const sessions = new Map<
    string,
    { continuationToken: string; events: Array<Record<string, unknown>> }
  >();
  const requests: RecordedRequest[] = [];
  let counter = 0;

  const json = (data: unknown, status: number) =>
    new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

  const fetchImpl = async (
    input: string | URL | Request,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const method = (init.method ?? "GET").toUpperCase();
    const body = init.body
      ? (JSON.parse(init.body as string) as Record<string, unknown>)
      : undefined;
    requests.push({ method, path, body });

    if (method === "POST" && /\/eve\/v1\/session$/.test(path)) {
      const sessionId = `s${++counter}`;
      const continuationToken = `eve:${sessionId}`;
      sessions.set(sessionId, {
        continuationToken,
        events: buildTurn(String(body?.message ?? ""), true),
      });
      return json({ sessionId, continuationToken }, 202);
    }

    const continueMatch = path.match(/\/eve\/v1\/session\/([^/]+)$/);
    if (method === "POST" && continueMatch) {
      const sessionId = decodeURIComponent(continueMatch[1]);
      const session = sessions.get(sessionId);
      if (!session) return json({ error: "no session" }, 404);
      session.events.push(...buildTurn(String(body?.message ?? ""), false));
      return json({ sessionId, continuationToken: session.continuationToken }, 200);
    }

    const streamMatch = path.match(/\/eve\/v1\/session\/([^/]+)\/stream/);
    if (method === "GET" && streamMatch) {
      const sessionId = decodeURIComponent(streamMatch[1]);
      const session = sessions.get(sessionId);
      if (!session) return json({ error: "no session" }, 404);
      const startIndex = Number(new URL(`http://eve${path}`).searchParams.get("startIndex") ?? "0");
      const ndjson =
        session.events
          .slice(startIndex)
          .map((e) => JSON.stringify(e))
          .join("\n") + "\n";
      return new Response(ndjson, { headers: { "content-type": "application/x-ndjson" } });
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  return { fetchImpl, requests };
}

/** Drives one turn through processMessage and returns the assistant text the UI would render. */
async function sendTurn(
  props: ReturnType<typeof createEveChatProps>,
  threadId: string,
  history: Message[],
  text: string,
): Promise<string> {
  const messages = [
    ...history,
    { id: crypto.randomUUID(), role: "user", content: text } as Message,
  ];
  const response = await props.processMessage({
    messages,
    threadId,
    abortController: new AbortController(),
  });

  let assistant = "";
  for (const event of parseSse(await response.text())) {
    if (event.type === "TEXT_MESSAGE_CONTENT" && event.delta) assistant += event.delta;
  }
  return assistant;
}

interface SseEvent {
  type: string;
  delta?: string;
  toolCallId?: string;
  toolCallName?: string;
}

/** Parses the AG-UI SSE body processMessage returns into events the OpenUI renderer would consume. */
function parseSse(body: string): SseEvent[] {
  const events: SseEvent[] = [];
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    events.push(JSON.parse(payload) as SseEvent);
  }
  return events;
}

/** Drives one turn and returns the full AG-UI event list (text + tool calls). */
async function collectTurn(
  props: ReturnType<typeof createEveChatProps>,
  threadId: string,
  text: string,
): Promise<SseEvent[]> {
  const response = await props.processMessage({
    messages: [{ id: crypto.randomUUID(), role: "user", content: text } as Message],
    threadId,
    abortController: new AbortController(),
  });
  return parseSse(await response.text());
}

let mock: ReturnType<typeof createEveMock>;
const realFetch = globalThis.fetch;

beforeEach(() => {
  mock = createEveMock();
  globalThis.fetch = mock.fetchImpl as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("createEveChatProps over Eve's native protocol", () => {
  it("streams a fresh reply for each turn in a thread (no replay)", async () => {
    const props = createEveChatProps(createMemoryStorage());
    const threadId = "thread-a";
    const history: Message[] = [];

    const r1 = await sendTurn(props, threadId, history, "Make a card with RED-111.");
    expect(r1).toContain("RED-111");
    history.push({ id: "u1", role: "user", content: "Make a card with RED-111." } as Message);
    history.push({ id: "a1", role: "assistant", content: r1 } as Message);

    const r2 = await sendTurn(props, threadId, history, "Now GREEN-222.");
    expect(r2).toContain("GREEN-222");
    expect(r2).not.toContain("RED-111"); // would indicate a replayed earlier turn
    history.push({ id: "u2", role: "user", content: "Now GREEN-222." } as Message);
    history.push({ id: "a2", role: "assistant", content: r2 } as Message);

    const r3 = await sendTurn(props, threadId, history, "Now BLUE-333.");
    expect(r3).toContain("BLUE-333");
    expect(r3).not.toContain("RED-111");
    expect(r3).not.toContain("GREEN-222");
  });

  it("creates a session on turn 1, then resumes with continuationToken + startIndex", async () => {
    const props = createEveChatProps(createMemoryStorage());
    await sendTurn(props, "thread-a", [], "Card RED-111.");
    await sendTurn(props, "thread-a", [], "Card GREEN-222.");

    const posts = mock.requests.filter((r) => r.method === "POST");
    expect(posts[0].path).toBe("/eve/v1/session"); // create
    expect(posts[0].body?.continuationToken).toBeUndefined();
    expect(posts[1].path).toBe("/eve/v1/session/s1"); // resume same session
    expect(posts[1].body?.continuationToken).toBe("eve:s1");

    const streams = mock.requests.filter((r) => r.path.includes("/stream"));
    expect(streams[0].path).not.toContain("startIndex"); // first turn reads from 0
    expect(streams[1].path).toContain("startIndex="); // second turn resumes past turn 1
  });

  it("keeps separate Eve sessions per thread (cross-thread isolation)", async () => {
    const props = createEveChatProps(createMemoryStorage());

    const a = await sendTurn(props, "thread-a", [], "Card AAA-1.");
    const b = await sendTurn(props, "thread-b", [], "Card BBB-2.");
    expect(a).toContain("AAA-1");
    expect(b).toContain("BBB-2");

    const created = mock.requests.filter(
      (r) => r.method === "POST" && r.path === "/eve/v1/session",
    );
    expect(created).toHaveLength(2); // each thread created its own session

    // A follow-up on thread-a resumes thread-a's session, not thread-b's.
    await sendTurn(props, "thread-a", [], "Card AAA-9.");
    const lastPost = mock.requests.filter((r) => r.method === "POST").at(-1);
    expect(lastPost?.path).toBe("/eve/v1/session/s1");
  });
});

describe("tool calls bridged to AG-UI", () => {
  // A turn where the model calls get_current_time, gets a result, then replies.
  const toolTurn: TurnBuilder = (_message, withSessionStart) => {
    const events: Array<Record<string, unknown>> = [];
    if (withSessionStart) events.push({ type: "session.started", data: {} });
    events.push({ type: "turn.started", data: {} });
    events.push({ type: "message.received", data: {} });
    events.push({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call-1",
            input: { timezone: "Asia/Tokyo" },
            kind: "tool-call",
            toolName: "get_current_time",
          },
        ],
        stepIndex: 0,
      },
    });
    events.push({
      type: "action.result",
      data: {
        result: {
          callId: "call-1",
          kind: "tool-result",
          output: { formatted: "9:00 AM" },
          toolName: "get_current_time",
        },
        status: "completed",
        stepIndex: 0,
      },
    });
    events.push({
      type: "message.appended",
      data: { messageDelta: 'root = Card([TextContent("It is 9:00 AM in Tokyo.")])', stepIndex: 1 },
    });
    events.push({ type: "turn.completed", data: {} });
    events.push({ type: "session.waiting", data: {} });
    return events;
  };

  beforeEach(() => {
    mock = createEveMock(toolTurn);
    globalThis.fetch = mock.fetchImpl as typeof fetch;
  });

  it("surfaces TOOL_CALL_START/ARGS/END plus the final reply in one stream", async () => {
    const props = createEveChatProps(createMemoryStorage());
    const events = await collectTurn(props, "thread-tool", "What time is it in Tokyo?");

    const types = events.map((e) => e.type);
    expect(types).toContain("TOOL_CALL_START");
    expect(types).toContain("TOOL_CALL_END");

    const start = events.find((e) => e.type === "TOOL_CALL_START");
    expect(start?.toolCallName).toBe("get_current_time");

    const args = events.find((e) => e.type === "TOOL_CALL_ARGS");
    expect(JSON.parse(args?.delta ?? "{}")).toEqual({ timezone: "Asia/Tokyo" });

    // The tool call is followed by the rendered text reply in the same turn.
    const text = events
      .filter((e) => e.type === "TEXT_MESSAGE_CONTENT")
      .map((e) => e.delta)
      .join("");
    expect(text).toContain("Tokyo");

    // Tool-call events precede the text content (so the UI shows the call above the reply).
    expect(types.indexOf("TOOL_CALL_START")).toBeLessThan(types.indexOf("TEXT_MESSAGE_CONTENT"));
  });
});
