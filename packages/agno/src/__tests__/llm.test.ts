import { describe, expect, it, vi } from "vitest";
import { createAgnoLLM } from "../llm";

describe("createAgnoLLM", () => {
  it("sends AgentOS extension containers and bearer authentication", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    const llm = createAgnoLLM({
      url: "/agui",
      token: "test-token",
      forwardedProps: { user_id: "user-1" },
      fetch: fetchMock,
    });

    await llm.send({
      threadId: "thread-1",
      messages: [{ id: "message-1", role: "user", content: "Hello" }],
      signal: new AbortController().signal,
    });

    const [url, request] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/agui");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(request?.body as string)).toMatchObject({
      threadId: "thread-1",
      state: {},
      forwardedProps: { user_id: "user-1" },
      tools: [],
      context: [],
    });
  });

  it("lets an explicit Authorization header override the token", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    const llm = createAgnoLLM({
      url: "/agui",
      token: "ignored",
      headers: { Authorization: "Bearer custom" },
      fetch: fetchMock,
    });

    await llm.send({
      threadId: "thread-1",
      messages: [{ id: "message-1", role: "user", content: "Hello" }],
      signal: new AbortController().signal,
    });

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer custom",
    });
  });
});
