import { describe, expect, it } from "vitest";
import type { AssistantMessage, Message } from "../message";
import { identityMessageFormat } from "../messageFormat";

describe("identityMessageFormat", () => {
  it("strips the client-only reasoning field from assistant messages in toApi", () => {
    const messages: Message[] = [
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "assistant", content: "hello", reasoning: "let me think" },
    ];

    const out = identityMessageFormat.toApi(messages) as Message[];

    expect(out).toHaveLength(2);
    const assistant = out[1] as AssistantMessage;
    expect(assistant.content).toBe("hello");
    expect("reasoning" in assistant).toBe(false);
  });

  it("leaves messages without reasoning untouched (same reference)", () => {
    const messages: Message[] = [
      { id: "u1", role: "user", content: "hi" },
      { id: "a1", role: "assistant", content: "hello" },
    ];

    const out = identityMessageFormat.toApi(messages) as Message[];

    expect(out[0]).toBe(messages[0]);
    expect(out[1]).toBe(messages[1]);
  });

  it("fromApi passes data through unchanged", () => {
    const data: Message[] = [{ id: "a1", role: "assistant", content: "hello" }];
    expect(identityMessageFormat.fromApi(data)).toBe(data);
  });
});
