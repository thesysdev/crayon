import type { UserMessage } from "@openuidev/react-headless";
import { describe, expect, it, vi } from "vitest";
import { agnoHistoryToMessages, agnoStorage } from "../storage";

function jsonResponse(value: unknown, status = 200) {
  return Response.json(value, { status });
}

describe("agnoHistoryToMessages", () => {
  it("maps AgentOS history and tool calls to canonical AG-UI messages", () => {
    expect(
      agnoHistoryToMessages(
        [
          { role: "system", content: "system" },
          { role: "user", content: "hello" },
          {
            role: "assistant",
            content: "",
            tool_calls: [{ id: "call-1", name: "lookup", args: { city: "Delhi" } }],
          },
          { role: "tool", tool_call_id: "call-1", content: { temperature: 31 } },
          { role: "assistant", content: "root = Card([])" },
        ],
        "thread-1",
      ),
    ).toEqual([
      { id: "thread-1-message-0", role: "system", content: "system" },
      { id: "thread-1-message-1", role: "user", content: "hello" },
      {
        id: "thread-1-message-2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "call-1",
            type: "function",
            function: { name: "lookup", arguments: '{"city":"Delhi"}' },
          },
        ],
      },
      {
        id: "thread-1-message-3",
        role: "tool",
        toolCallId: "call-1",
        content: '{"temperature":31}',
      },
      {
        id: "thread-1-message-4",
        role: "assistant",
        content: "root = Card([])",
      },
    ]);
  });
});

describe("agnoStorage", () => {
  it("maps AgentOS session CRUD and pagination to OpenUI threads", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      requests.push({ url, init });

      if (url.includes("page=2")) {
        return jsonResponse({
          data: [
            {
              session_id: "session-2",
              session_name: "Existing session",
              created_at: "2026-08-24T00:00:00Z",
            },
          ],
          meta: { page: 2, total_pages: 3 },
        });
      }
      if (init?.method === "POST" && url.endsWith("/sessions?type=agent&user_id=user-1")) {
        return jsonResponse(
          {
            session_id: "session-new",
            session_name: "Build a revenue dashboard",
            created_at: "2026-08-24T00:00:00Z",
          },
          201,
        );
      }
      if (url.includes("/sessions/session-2/rename")) {
        return jsonResponse({
          session_id: "session-2",
          session_name: "Renamed",
          created_at: "2026-08-24T00:00:00Z",
        });
      }
      if (url.includes("/sessions/session-2") && init?.method !== "DELETE") {
        return jsonResponse({
          session_id: "session-2",
          session_name: "Existing session",
          chat_history: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "root = Card([])" },
          ],
        });
      }
      return new Response(null, { status: 204 });
    });

    const storage = agnoStorage({
      baseUrl: "https://agent.example",
      entityType: "agent",
      entityId: "openui-agent",
      userId: "user-1",
      pageSize: 10,
      token: "test-token",
      fetch: fetchMock,
    });

    await expect(storage.thread.listThreads("2")).resolves.toEqual({
      threads: [
        {
          id: "session-2",
          title: "Existing session",
          createdAt: "2026-08-24T00:00:00Z",
        },
      ],
      nextCursor: "3",
    });

    await expect(
      storage.thread.createThread({
        id: "message-1",
        role: "user",
        content: "  Build   a revenue dashboard  ",
      } as UserMessage),
    ).resolves.toMatchObject({ id: "session-new", title: "Build a revenue dashboard" });

    await expect(storage.thread.getMessages("session-2")).resolves.toEqual([
      { id: "session-2-message-0", role: "user", content: "Hello" },
      { id: "session-2-message-1", role: "assistant", content: "root = Card([])" },
    ]);

    await expect(
      storage.thread.updateThread({
        id: "session-2",
        title: "Renamed",
        createdAt: "2026-08-24T00:00:00Z",
      }),
    ).resolves.toMatchObject({ id: "session-2", title: "Renamed" });

    await storage.thread.deleteThread("session-2");

    expect(requests[0]?.url).toContain(
      "/sessions?type=agent&user_id=user-1&component_id=openui-agent&limit=10&page=2",
    );
    expect(requests[1]?.init?.body).toBe(
      JSON.stringify({
        session_name: "Build a revenue dashboard",
        user_id: "user-1",
        agent_id: "openui-agent",
      }),
    );
    expect(requests[3]?.init?.body).toBe(JSON.stringify({ session_name: "Renamed" }));
    expect(requests[4]?.init?.method).toBe("DELETE");
    expect(requests.every(({ init }) => init?.headers)).toBe(true);
  });

  it("surfaces AgentOS error details", async () => {
    const storage = agnoStorage({
      baseUrl: "https://agent.example",
      entityType: "team",
      entityId: "research-team",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ detail: "Session database is unavailable" }, 503)),
    });

    await expect(storage.thread.listThreads()).rejects.toThrow("Session database is unavailable");
  });
});
