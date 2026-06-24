import { describe, expect, it } from "vitest";
import type { AssistantMessage, ToolCall, ToolMessage } from "../../types";
import { pairToolActivity, partialJSONParse } from "../toolActivity";

const tc = (id: string, name: string, args: string): ToolCall => ({
  id,
  type: "function",
  function: { name, arguments: args },
});

const assistant = (toolCalls: ToolCall[]): AssistantMessage => ({
  id: "a1",
  role: "assistant",
  content: "",
  toolCalls,
});

const toolMsg = (toolCallId: string, content: string, error?: string): ToolMessage => ({
  id: `t_${toolCallId}`,
  role: "tool",
  toolCallId,
  content,
  ...(error ? { error } : {}),
});

describe("partialJSONParse", () => {
  it("returns {} for empty input", () => {
    expect(partialJSONParse("")).toEqual({});
  });

  it("parses complete JSON", () => {
    expect(partialJSONParse('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
  });

  it("balances a truncated object (open brace)", () => {
    expect(partialJSONParse('{"a":1,"b":2')).toEqual({ a: 1, b: 2 });
  });

  it("closes a mid-stream string", () => {
    expect(partialJSONParse('{"a":"hel')).toEqual({ a: "hel" });
  });

  it("drops a dangling key awaiting a value (trailing colon)", () => {
    expect(partialJSONParse('{"a":1,"b":')).toEqual({ a: 1 });
  });

  it("keeps complete array elements when truncated", () => {
    expect(partialJSONParse('["a","b"')).toEqual(["a", "b"]);
  });

  it("never throws on garbage", () => {
    expect(partialJSONParse("not json")).toEqual({});
  });
});

describe("pairToolActivity", () => {
  it("reports `streaming` while args arrive with no result and not executing", () => {
    const [a] = pairToolActivity(assistant([tc("1", "search", '{"q":"par')]), []);
    expect(a?.status).toBe("streaming");
    expect(a?.input).toEqual({ q: "par" });
    expect(a?.result).toBeUndefined();
    expect(a?.isError).toBe(false);
  });

  it("reports `executing` when args have closed (in the executing set) with no result", () => {
    const [a] = pairToolActivity(
      assistant([tc("1", "search", '{"q":"paris"}')]),
      [],
      new Set(["1"]),
    );
    expect(a?.status).toBe("executing");
    expect(a?.input).toEqual({ q: "paris" });
  });

  it("reports `complete` when a result message lands without error", () => {
    const [a] = pairToolActivity(assistant([tc("1", "search", '{"q":"paris"}')]), [
      toolMsg("1", '{"ok":true}'),
    ]);
    expect(a?.status).toBe("complete");
    expect(a?.result).toBe('{"ok":true}');
    expect(a?.isError).toBe(false);
  });

  it("reports `error` when the result message carries an error", () => {
    const [a] = pairToolActivity(assistant([tc("1", "search", "{}")]), [
      toolMsg("1", "boom", "tool exploded"),
    ]);
    expect(a?.status).toBe("error");
    expect(a?.isError).toBe(true);
    if (a?.status === "error") expect(a.errorText).toBe("tool exploded");
  });

  it("pairs by toolCallId regardless of message position (no positional break)", () => {
    // Tool result for call "2" appears before the result for call "1".
    const activities = pairToolActivity(assistant([tc("1", "a", "{}"), tc("2", "b", "{}")]), [
      toolMsg("2", "r2"),
      toolMsg("1", "r1"),
    ]);
    expect(activities).toHaveLength(2);
    expect(activities[0]?.id).toBe("1");
    expect(activities[0]?.result).toBe("r1");
    expect(activities[1]?.id).toBe("2");
    expect(activities[1]?.result).toBe("r2");
  });

  it("reads the deprecated `_title` arg key into statusMessage", () => {
    const [a] = pairToolActivity(assistant([tc("1", "x", '{"_title":"Searching"}')]), []);
    expect(a?.statusMessage).toBe("Searching");
  });

  it("renders an orphan tool result (a trailing tool message with no matching call)", () => {
    const a = assistant([]); // no tool calls
    const tm = toolMsg("orphan-1", "the result");
    const activities = pairToolActivity(a, [a, tm]);
    expect(activities).toHaveLength(1);
    expect(activities[0]?.toolCall.id).toBe("orphan-1");
    expect(activities[0]?.status).toBe("complete");
    expect(activities[0]?.result).toBe("the result");
  });

  it("gives two orphan results sharing a toolCallId distinct activity ids (no key collision)", () => {
    const a = assistant([]);
    const tm1: ToolMessage = { id: "tm-a", role: "tool", toolCallId: "dup", content: "r1" };
    const tm2: ToolMessage = { id: "tm-b", role: "tool", toolCallId: "dup", content: "r2" };
    const activities = pairToolActivity(a, [a, tm1, tm2]);
    expect(activities).toHaveLength(2);
    expect(new Set(activities.map((x) => x.id)).size).toBe(2);
  });

  it("does not double-render a result owned by another assistant message's call", () => {
    const a1 = assistant([tc("1", "x", "{}")]); // owns call "1"
    const a2: AssistantMessage = { id: "a2", role: "assistant", content: "", toolCalls: [] };
    const tm = toolMsg("1", "r1");
    // Order a1, a2, tm: tm positionally trails a2 but its call belongs to a1.
    expect(pairToolActivity(a2, [a1, a2, tm])).toHaveLength(0); // not an orphan under a2
    const owned = pairToolActivity(a1, [a1, a2, tm]);
    expect(owned).toHaveLength(1); // paired by id under a1
    expect(owned[0]?.result).toBe("r1");
  });
});
