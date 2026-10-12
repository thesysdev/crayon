import { describe, expect, it, vi } from "vitest";
import { createChatStore } from "../../store/createChatStore";
import type { UserMessage } from "../../types/message";
import { createDefaultInMemoryStorage } from "../_defaultStorage";

// The user turn produced by react-ui's buildActionUserMessage for @ToAssistant.
const actionMessage = [
  "]]>openui:content",
  "Explain this order",
  "]]>openui:context",
  '["User clicked: Explain this order",{"$qty":3},{"orderId":1042,"quantity":3}]',
].join("\n");

describe("default in-memory thread titles", () => {
  it("uses readable action content when restored messages have no active thread", async () => {
    const storage = createDefaultInMemoryStorage();
    const send = vi.fn().mockResolvedValue(new Response(""));
    const store = createChatStore({
      current: {
        storage,
        llm: { send, streamProtocol: { async *parse() {} } },
      },
    });
    store
      .getState()
      .setMessages([
        { id: "restored-assistant", role: "assistant", content: 'root = Card("Order", [])' },
      ]);
    await store.getState().processMessage({ role: "user", content: actionMessage });

    const thread = store.getState().threads[0]!;
    expect(thread.title).toBe("Explain this order");
    expect(store.getState().selectedThreadId).toBe(thread.id);
    expect(store.getState().messages[1]!.content).toBe(actionMessage);
    expect((await storage.thread.getMessages(thread.id))[0]!.content).toBe(actionMessage);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([expect.objectContaining({ content: actionMessage })]),
      }),
    );
  });

  it("truncates decoded content rather than the marker or its attributes", async () => {
    const content = "This is an order explanation that is longer than forty characters";
    const message: UserMessage = {
      id: "long-action",
      role: "user",
      content: `]]>openui:content?libraryVersion=1.0&library=order-desk\n${content}\n]]>openui:end`,
    };
    const storage = createDefaultInMemoryStorage();
    const thread = await storage.thread.createThread(message);
    expect(thread.title).toBe(content.slice(0, 40));
    expect(await storage.thread.getMessages(thread.id)).toEqual([message]);
  });

  it("falls back to New thread when a stored turn contains only context", async () => {
    const storage = createDefaultInMemoryStorage();
    const thread = await storage.thread.createThread({
      id: "context-only",
      role: "user",
      content: '\n]]>openui:context\n["User clicked: ",{"$qty":3}]',
    });
    expect(thread.title).toBe("New thread");
  });

  it.each([
    ["Order desk", "Order desk"],
    ["", "New thread"],
    [
      "A plain message whose title must still be limited to forty characters",
      "A plain message whose title must still b",
    ],
  ])("preserves the plain-text title behavior for %j", async (content, title) => {
    const thread = await createDefaultInMemoryStorage().thread.createThread({
      id: "plain",
      role: "user",
      content,
    });
    expect(thread.title).toBe(title);
  });

  it("preserves the fallback for multipart messages", async () => {
    const thread = await createDefaultInMemoryStorage().thread.createThread({
      id: "multipart",
      role: "user",
      content: [{ type: "text", text: "Order desk" }],
    });
    expect(thread.title).toBe("New thread");
  });
});
