import { EventType } from "@ag-ui/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLangChainStreamResponse } from "../request-handler";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createLangChainStreamResponse", () => {
  it("converts visible AG-UI history and returns an AG-UI event stream", async () => {
    const endEvent = { type: EventType.TEXT_MESSAGE_END, messageId: "response-1" };
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith("/stream/events")) {
        return new Response(
          [
            `event: custom\ndata: ${JSON.stringify({ type: "event", params: { data: { name: "openui", payload: endEvent } } })}\n\n`,
            `event: lifecycle\ndata: ${JSON.stringify({ type: "event", params: { namespace: [], data: { event: "completed" } } })}\n\n`,
          ].join(""),
        );
      }
      return Response.json({ type: "success", id: 1, result: { run_id: "run-1" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("https://app.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            id: "user-1",
            role: "user",
            content: [
              { type: "text", text: "Describe this" },
              { type: "image", source: { type: "url", value: "https://example.com/a.png" } },
            ],
          },
          {
            id: "assistant-1",
            role: "assistant",
            content: "I will check",
            toolCalls: [
              {
                id: "call-1",
                type: "function",
                function: { name: "inspect", arguments: '{"id":1}' },
              },
            ],
          },
          {
            id: "tool-1",
            role: "tool",
            content: "internal result",
            toolCallId: "call-1",
          },
          { id: "developer-1", role: "developer", content: "Be concise" },
          { id: "activity-1", role: "activity", activityType: "status", content: {} },
        ],
      }),
    });

    const response = await createLangChainStreamResponse(request, {
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      cleanupThread: false,
    });

    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("connection")).toBeNull();
    const output = parseOutput(await response.text());
    expect(output).toEqual([
      {
        type: EventType.RUN_STARTED,
        threadId: expect.any(String),
        runId: "run-1",
      },
      endEvent,
      {
        type: EventType.RUN_FINISHED,
        threadId: expect.any(String),
        runId: "run-1",
      },
    ]);
    expect(output[0]?.threadId).toBe(output.at(-1)?.threadId);

    const commandCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/commands"));
    const command = JSON.parse(String(commandCall?.[1]?.body));
    expect(command.params.input.messages).toEqual([
      {
        type: "human",
        content: [
          { type: "text", text: "Describe this" },
          { type: "image", url: "https://example.com/a.png" },
        ],
      },
      {
        type: "ai",
        content: "I will check",
        tool_calls: [{ id: "call-1", name: "inspect", args: { id: 1 } }],
      },
      { type: "tool", content: "internal result", tool_call_id: "call-1" },
      { type: "system", content: "Be concise" },
    ]);
  });

  it("removes only incomplete tool transcripts", async () => {
    let commandInput: unknown;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).endsWith("/stream/events")) {
        return new Response(
          `event: lifecycle\ndata: ${JSON.stringify({ type: "event", params: { namespace: [], data: { event: "completed" } } })}\n\n`,
        );
      }
      commandInput = JSON.parse(String(init?.body)).params.input;
      return Response.json({ type: "success", id: 1, result: { run_id: "run-2" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = chatRequest([
      { id: "user-1", role: "user", content: "Check both" },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Checking",
        toolCalls: [
          {
            id: "complete-call",
            type: "function",
            function: { name: "weather", arguments: '{"city":"Paris"}' },
          },
          {
            id: "incomplete-call",
            type: "function",
            function: { name: "weather", arguments: '{"city":"Rome"}' },
          },
        ],
      },
      {
        id: "tool-1",
        role: "tool",
        content: "21C",
        toolCallId: "complete-call",
      },
      { id: "user-2", role: "user", content: "Thanks" },
      {
        id: "orphan-tool",
        role: "tool",
        content: "orphan",
        toolCallId: "unknown-call",
      },
    ]);

    const response = await createLangChainStreamResponse(request, {
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      cleanupThread: false,
    });
    await response.text();

    expect(commandInput).toEqual({
      messages: [
        { type: "human", content: "Check both" },
        {
          type: "ai",
          content: "Checking",
          tool_calls: [
            {
              id: "complete-call",
              name: "weather",
              args: { city: "Paris" },
            },
          ],
        },
        { type: "tool", content: "21C", tool_call_id: "complete-call" },
        { type: "human", content: "Thanks" },
      ],
    });
  });

  it("lets callers forward request fields into the graph input", async () => {
    let commandInput: unknown;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).endsWith("/stream/events")) {
        return new Response(
          `event: lifecycle\ndata: ${JSON.stringify({ type: "event", params: { namespace: [], data: { event: "completed" } } })}\n\n`,
        );
      }
      commandInput = JSON.parse(String(init?.body)).params.input;
      return Response.json({ type: "success", id: 1, result: { run_id: "run-3" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("https://app.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: "conversation-1",
        model: "gpt-5.5",
        messages: [{ id: "user-1", role: "user", content: "Hello" }],
      }),
    });

    const response = await createLangChainStreamResponse(request, {
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
      cleanupThread: false,
      prepareInput: ({ messages, requestBody }) => ({
        messages: messages.slice(-1),
        conversationId: requestBody.threadId,
        model: requestBody.model,
      }),
    });
    await response.text();

    expect(commandInput).toEqual({
      messages: [{ type: "human", content: "Hello" }],
      conversationId: "conversation-1",
      model: "gpt-5.5",
    });
  });

  it("returns 400 when custom input validation fails", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createLangChainStreamResponse(
      chatRequest([{ id: "user-1", role: "user", content: "Hello" }]),
      {
        apiUrl: "https://langgraph.example",
        assistantId: "agent",
        prepareInput: () => {
          throw new Error("threadId is required");
        },
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "threadId is required" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", "{"],
    ["a missing messages property", JSON.stringify({})],
    ["a non-array messages property", JSON.stringify({ messages: "invalid" })],
    ["an empty messages array", JSON.stringify({ messages: [] })],
    ["invalid message objects", JSON.stringify({ messages: [{ role: "user" }] })],
  ])("returns 400 for %s without starting a run", async (_label, body) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://app.example/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const response = await createLangChainStreamResponse(request, {
      apiUrl: "https://langgraph.example",
      assistantId: "agent",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Expected a JSON request body containing a non-empty messages array",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function chatRequest(messages: unknown[]): Request {
  return new Request("https://app.example/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

function parseOutput(output: string): Array<Record<string, unknown>> {
  return output
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => JSON.parse(frame.replace(/^data: /, "")) as Record<string, unknown>);
}
