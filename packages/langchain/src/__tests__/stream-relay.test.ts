import { EventSchemas, EventType, type AGUIEvent } from "@ag-ui/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { streamOpenUI } from "../stream-relay";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("streamOpenUI", () => {
  it("relays only valid OpenUI custom-channel events across chunked CRLF SSE", async () => {
    const start = { type: EventType.TEXT_MESSAGE_START, messageId: "m1", role: "assistant" };
    const content = { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Hello" };
    const end = { type: EventType.TEXT_MESSAGE_END, messageId: "m1" };
    const sse = [
      protocolFrame("custom", { name: "other", payload: start }, "\r\n"),
      "event: custom\r\ndata: not-json\r\n\r\n",
      protocolFrame("custom", { name: "openui", payload: start }, "\r\n"),
      bareFrame("custom:openui", content, "\r\n"),
      protocolFrame("custom", { name: "openui", payload: end }, "\r\n"),
    ].join("");

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/stream/events")) {
        return new Response(chunkedBody([sse.slice(0, 47), sse.slice(47, 131), sse.slice(131)]));
      }
      expect(init?.method).toBe("POST");
      return runStartedResponse("run-1");
    });
    vi.stubGlobal("fetch", fetchMock);

    const output = await new Response(
      streamOpenUI({
        apiUrl: "https://langgraph.example/",
        assistantId: "agent",
        apiKey: "secret",
        input: { messages: [] },
        cleanupThread: false,
      }),
    ).text();

    const events = parseOutput(output);
    expect(events).toEqual([
      {
        type: EventType.RUN_STARTED,
        threadId: expect.any(String),
        runId: "run-1",
      },
      start,
      content,
      end,
      {
        type: EventType.RUN_FINISHED,
        threadId: expect.any(String),
        runId: "run-1",
      },
    ]);
    expect(events[0]?.threadId).toBe(events.at(-1)?.threadId);
    expectValidAGUIEvents(events);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const commandCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/commands"));
    expect(commandCall).toBeDefined();
    expect(commandCall?.[1]?.headers).toEqual({
      "Content-Type": "application/json",
      "x-api-key": "secret",
    });
    expect(JSON.parse(String(commandCall?.[1]?.body))).toMatchObject({
      method: "run.start",
      params: { assistant_id: "agent", input: { messages: [] } },
    });
    const streamCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/stream/events"),
    );
    expect(JSON.parse(String(streamCall?.[1]?.body))).toEqual({
      channels: ["custom:openui", "lifecycle"],
    });
  });

  it("relays multiple assistant messages and tool results until root lifecycle completes", async () => {
    const relayed = [
      { type: EventType.TEXT_MESSAGE_START, messageId: "m1", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "m1", delta: "Let me check." },
      { type: EventType.TOOL_CALL_START, toolCallId: "call-1", toolCallName: "weather" },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '{"city":"Paris"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "call-1" },
      { type: EventType.TEXT_MESSAGE_END, messageId: "m1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-call-1",
        toolCallId: "call-1",
        content: '{"temperature":21}',
        role: "tool",
      },
      { type: EventType.TEXT_MESSAGE_START, messageId: "m2", role: "assistant" },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "m2",
        delta: '<Card title="Paris">21C</Card>',
      },
      { type: EventType.TEXT_MESSAGE_END, messageId: "m2" },
    ] satisfies AGUIEvent[];
    const sse = [
      ...relayed.map((event) => protocolFrame("custom", { name: "openui", payload: event })),
      lifecycleFrame({ event: "completed" }),
    ].join("");

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith("/stream/events")) return new Response(sse);
      return runStartedResponse("run-multiple");
    });
    vi.stubGlobal("fetch", fetchMock);

    const events = parseOutput(
      await new Response(
        streamOpenUI({
          apiUrl: "https://langgraph.example",
          assistantId: "agent",
          input: { messages: [] },
          cleanupThread: false,
        }),
      ).text(),
    );

    expect(events.slice(1, -1)).toEqual(relayed);
    expect(events[0]).toMatchObject({ type: EventType.RUN_STARTED, runId: "run-multiple" });
    expect(events.at(-1)).toMatchObject({
      type: EventType.RUN_FINISHED,
      runId: "run-multiple",
    });
    expectValidAGUIEvents(events);
  });

  it("ignores nested lifecycle completion until the root run completes", async () => {
    const start = {
      type: EventType.TEXT_MESSAGE_START,
      messageId: "nested-message",
      role: "assistant",
    } satisfies AGUIEvent;
    const content = {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: "nested-message",
      delta: "Still running",
    } satisfies AGUIEvent;
    const sse = [
      protocolFrame("custom", { name: "openui", payload: start }),
      lifecycleFrame({ event: "completed" }, ["subgraph:worker"]),
      protocolFrame("custom", { name: "openui", payload: content }),
      lifecycleFrame({ event: "completed" }),
    ].join("");

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).endsWith("/stream/events")) return new Response(sse);
        return runStartedResponse("run-root");
      }),
    );

    const events = parseOutput(
      await new Response(
        streamOpenUI({
          apiUrl: "https://langgraph.example",
          assistantId: "agent",
          input: {},
          cleanupThread: false,
        }),
      ).text(),
    );

    expect(events).toEqual([
      expect.objectContaining({ type: EventType.RUN_STARTED, runId: "run-root" }),
      start,
      content,
      expect.objectContaining({ type: EventType.RUN_FINISHED, runId: "run-root" }),
    ]);
    expectValidAGUIEvents(events);
  });

  it("redacts run-start internals by default", async () => {
    let eventStreamSignal: AbortSignal | null | undefined;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/stream/events")) {
        eventStreamSignal = init?.signal;
        return new Response(abortableBody(eventStreamSignal));
      }
      if (url.endsWith("/commands")) return new Response("assistant not found", { status: 404 });
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const output = await new Response(
      streamOpenUI({
        apiUrl: "https://langgraph.example",
        assistantId: "missing-agent",
        input: {},
        cleanupThread: false,
      }),
    ).text();

    expect(parseOutput(output)).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "Unable to complete LangGraph run",
      },
    ]);
    expect(eventStreamSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("includes assistant hints only when debug errors are enabled", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/stream/events")) return new Response(abortableBody(init?.signal));
      if (url.endsWith("/commands")) return new Response("assistant not found", { status: 404 });
      if (url.endsWith("/assistants/search")) {
        return Response.json([{ graph_id: "weather-agent" }, { graph_id: "research-agent" }]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const output = await new Response(
      streamOpenUI({
        apiUrl: "https://langgraph.example",
        assistantId: "missing-agent",
        input: {},
        debug: true,
        cleanupThread: false,
      }),
    ).text();

    expect(parseOutput(output)).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: expect.stringContaining(
          'Configured assistant "missing-agent" is not registered on this LangGraph server; available graph ids: weather-agent, research-agent',
        ),
      },
    ]);
  });

  it("deletes its temporary LangGraph thread after completion by default", async () => {
    let finishDelete: (() => void) | undefined;
    const deleteGate = new Promise<void>((resolve) => {
      finishDelete = resolve;
    });
    const waitUntil = vi.fn<(task: Promise<void>) => void>();
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/stream/events")) {
        return new Response(lifecycleFrame({ event: "completed" }));
      }
      if (url.endsWith("/commands")) return runStartedResponse("run-cleanup");
      if (init?.method === "DELETE") {
        await deleteGate;
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const outputPromise = new Response(
      streamOpenUI({
        apiUrl: "https://langgraph.example",
        assistantId: "agent",
        input: {},
        waitUntil,
      }),
    ).text();
    let responseClosed = false;
    void outputPromise.then(() => {
      responseClosed = true;
    });

    await vi.waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true),
    );
    expect(responseClosed).toBe(false);
    expect(waitUntil).toHaveBeenCalledTimes(1);

    finishDelete?.();
    const events = parseOutput(await outputPromise);

    expect(responseClosed).toBe(true);
    const threadId = events[0]?.type === EventType.RUN_STARTED ? events[0].threadId : undefined;
    const deleteCall = fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE");
    expect(String(deleteCall?.[0])).toBe(`https://langgraph.example/threads/${threadId}`);
  });

  it.each([
    ["an empty response", ""],
    ["a response without run_id", JSON.stringify({ type: "success", id: 1, result: {} })],
  ])("rejects %s instead of fabricating a run id", async (_label, commandBody) => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).endsWith("/stream/events")) {
        return new Response(abortableBody(init?.signal));
      }
      return new Response(commandBody);
    });
    vi.stubGlobal("fetch", fetchMock);

    const events = parseOutput(
      await new Response(
        streamOpenUI({
          apiUrl: "https://langgraph.example",
          assistantId: "agent",
          input: {},
          debug: true,
          cleanupThread: false,
        }),
      ).text(),
    );

    expect(events).toEqual([
      { type: EventType.RUN_ERROR, message: "LangGraph run.start returned no run id" },
    ]);
  });

  it("aborts upstream requests when the consumer cancels", async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      const url = String(input);
      if (url.endsWith("/stream/events")) {
        return new Response(abortableBody(init?.signal));
      }
      return Response.json({ type: "success" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const reader = streamOpenUI({
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      input: {},
      cleanupThread: false,
    }).getReader();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await reader.cancel();

    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("registers and awaits thread cleanup when the consumer cancels after run start", async () => {
    const waitUntil = vi.fn<(task: Promise<void>) => void>();
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/stream/events")) return new Response(abortableBody(init?.signal));
      if (url.endsWith("/commands")) return runStartedResponse("run-cancel-cleanup");
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const reader = streamOpenUI({
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      input: {},
      waitUntil,
    }).getReader();

    const started = await reader.read();
    expect(parseOutput(new TextDecoder().decode(started.value))).toEqual([
      expect.objectContaining({ type: EventType.RUN_STARTED, runId: "run-cancel-cleanup" }),
    ]);
    await reader.cancel();

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true);
  });

  it("closes the relay when the caller signal aborts while output is backpressured", async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      if (String(input).endsWith("/stream/events")) {
        return new Response(abortableBody(init?.signal));
      }
      return runStartedResponse("run-abort");
    });
    vi.stubGlobal("fetch", fetchMock);
    const callerAbort = new AbortController();
    const outputReader = streamOpenUI({
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      input: {},
      signal: callerAbort.signal,
      cleanupThread: false,
    }).getReader();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    callerAbort.abort();

    await expect(outputReader.read()).resolves.toEqual({ done: true, value: undefined });
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("waits for downstream demand before reading the upstream event stream", async () => {
    let upstreamPulls = 0;
    const eventBody = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          upstreamPulls += 1;
          controller.enqueue(new TextEncoder().encode(lifecycleFrame({ event: "completed" })));
          controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith("/stream/events")) return new Response(eventBody);
      return runStartedResponse("run-backpressure");
    });
    vi.stubGlobal("fetch", fetchMock);

    const outputReader = streamOpenUI({
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      input: {},
      cleanupThread: false,
    }).getReader();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(upstreamPulls).toBe(0);

    const start = await outputReader.read();
    expect(parseOutput(new TextDecoder().decode(start.value))).toEqual([
      expect.objectContaining({ type: EventType.RUN_STARTED, runId: "run-backpressure" }),
    ]);
    await vi.waitFor(() => expect(upstreamPulls).toBe(1));

    const finish = await outputReader.read();
    expect(parseOutput(new TextDecoder().decode(finish.value))).toEqual([
      expect.objectContaining({ type: EventType.RUN_FINISHED, runId: "run-backpressure" }),
    ]);
    await expect(outputReader.read()).resolves.toEqual({ done: true, value: undefined });
  });
});

function runStartedResponse(runId: string): Response {
  return Response.json({ type: "success", id: 1, result: { run_id: runId } });
}

function protocolFrame(event: string, data: unknown, newline = "\n"): string {
  return `${bareFrame(event, { type: "event", params: { data } }, newline)}`;
}

function bareFrame(event: string, data: unknown, newline = "\n"): string {
  return `event: ${event}${newline}data: ${JSON.stringify(data)}${newline}${newline}`;
}

function lifecycleFrame(data: unknown, namespace: string[] = []): string {
  return bareFrame("lifecycle", {
    type: "event",
    method: "lifecycle",
    params: { namespace, data },
  });
}

function chunkedBody(chunks: string[]): ReadableStream<Uint8Array> {
  const textEncoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(textEncoder.encode(chunk));
      controller.close();
    },
  });
}

function abortableBody(signal?: AbortSignal | null): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      signal?.addEventListener(
        "abort",
        () => controller.error(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    },
  });
}

function parseOutput(output: string): AGUIEvent[] {
  return output
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => JSON.parse(frame.replace(/^data: /, "")) as AGUIEvent);
}

function expectValidAGUIEvents(events: AGUIEvent[]): void {
  for (const event of events) {
    expect(EventSchemas.safeParse(event).success, JSON.stringify(event)).toBe(true);
  }
}
