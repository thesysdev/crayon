import { EventType, type AGUIEvent } from "@ag-ui/core";
import { describe, expect, it } from "vitest";
import {
  decodeGrokSessionNotification,
  type GrokBuildSessionUpdate,
} from "./grok-build-acp";
import { GrokBuildAGUIBridge } from "./grok-build-stream";
import {
  chunkOpenUIOutput,
  createOpenUIStatus,
  isRenderableOpenUI,
  OpenUIOutputAccumulator,
} from "./openui-output";

function agentMessage(text: string): GrokBuildSessionUpdate {
  return {
    sessionUpdate: "agent_message_chunk",
    content: { type: "text", text },
  };
}

function retry(): GrokBuildSessionUpdate {
  return {
    sessionUpdate: "retry_state",
    type: "retrying",
    attempt: 1,
    max_retries: 15,
  };
}

function emittedText(events: AGUIEvent[]): string {
  return events
    .filter(
      (event): event is AGUIEvent & { delta: string } =>
        event.type === EventType.TEXT_MESSAGE_CONTENT && "delta" in event,
    )
    .map((event) => event.delta)
    .join("");
}

describe("OpenUI output safety", () => {
  it("keeps only the final renderable candidate when Grok emits several roots", () => {
    const bridge = new GrokBuildAGUIBridge();
    const failedCandidate =
      'root = Card([old])\nold = TextContent("This attempt was retried")';
    const finalCandidate =
      'root = Card([answer])\nanswer = TextContent("Final retry-safe answer")';

    bridge.consume(agentMessage("I'll inspect the repository first."));
    bridge.consume(agentMessage(failedCandidate));
    bridge.consume(agentMessage('root = Card([stale])\nstale = TextContent("stale")'));
    bridge.consume(agentMessage(finalCandidate));

    const text = emittedText(bridge.finish());
    expect(text).toBe(finalCandidate);
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("decodes Grok's live retry envelope and clears the failed attempt", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume(agentMessage("failed attempt prose"));
    const notification = decodeGrokSessionNotification("x.ai/session_notification", {
      sessionId: crypto.randomUUID(),
      update: retry(),
    });

    expect(notification).toBeDefined();
    bridge.consume(notification!.update);
    bridge.consume(agentMessage("final plain-text answer"));

    const text = emittedText(bridge.finish());
    expect(text).toContain("final plain-text answer");
    expect(text).not.toContain("failed attempt prose");
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("handles a stale candidate delivered after its retry notification", () => {
    const bridge = new GrokBuildAGUIBridge();
    const stale = 'root = Card([stale])\nstale = TextContent("overtaken attempt")';
    const final = 'root = Card([answer])\nanswer = TextContent("final answer")';

    bridge.consume(retry());
    bridge.consume(agentMessage(stale));
    bridge.consume(agentMessage("ro"));
    bridge.consume(agentMessage(final.slice(2)));

    const text = emittedText(bridge.finish());
    expect(text).toBe(final);
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("recognizes a root statement split across ACP chunks", () => {
    const output = new OpenUIOutputAccumulator();
    output.push("progress prose\nro");
    output.push('ot = Card([answer])\nanswer = TextContent("chunked")');

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("chunked")',
    );
  });

  it("recovers a newer root split across chunks directly after another answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('root = Card([old])\nold = TextContent("retried answer")');
    output.push("ro");
    output.push('ot = Card([answer])\nanswer = TextContent("newest answer")');

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("newest answer")',
    );
  });

  it("extracts a valid root after a malformed same-line prefix", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('?\")ro');
    output.push('ot = Card([answer])\nanswer = TextContent("recovered")');

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("recovered")',
    );
  });

  it("ignores a root-looking example inside a component string", () => {
    const output = new OpenUIOutputAccumulator();
    const source =
      'root = Card([answer])\nanswer = TextContent("literal root = Card([fake])\\nfake = TextContent(\\"fake\\")")';
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("tracks single-quoted strings while finding candidate boundaries", () => {
    const output = new OpenUIOutputAccumulator();
    const source =
      "root = Card([answer])\nanswer = TextContent('literal ) root = Card([])')";
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("ignores root-like text and delimiters inside line comments", () => {
    const output = new OpenUIOutputAccumulator();
    const source = [
      "root = Card([answer])",
      "// ) root = Card([])",
      "# ] root = Card([])",
      'answer = TextContent("comments are ignored")',
    ].join("\n");
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("stops a fenced OpenUI candidate before trailing prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      'Here is the UI:\n```openui\nroot = Card([answer])\nanswer = TextContent("fenced")\n```\nHope that helps.',
    );

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("fenced")',
    );
  });

  it("prefers fenced OpenUI over a root-looking example in trailing prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "Here:",
        "```openui",
        'root = Card([answer])',
        'answer = TextContent("correct")',
        "```",
        "Syntax reminder: call Card() root = Card([])",
      ].join("\n"),
    );

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("correct")',
    );
  });

  it("recognizes a fence after possessive prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "Here is the users' requested UI:",
        "```openui",
        "root = Card([])",
        "```",
        'Reminder: root = Card([missing])',
      ].join("\n"),
    );

    expect(output.finish()).toBe("root = Card([])");
  });

  it("lets a later unfenced retry supersede an earlier fenced answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "```openui",
        'root = Card([old])',
        'old = TextContent("stale")',
        "```",
        'root = Card([answer])',
        'answer = TextContent("final")',
      ].join("\n"),
    );

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("final")',
    );
  });

  it("lets a later fenced retry supersede an earlier unfenced answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        'root = Card([old])',
        'old = TextContent("stale")',
        "```openui",
        'root = Card([answer])',
        'answer = TextContent("final")',
        "```",
      ].join("\n"),
    );

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("final")',
    );
  });

  it("recovers a split same-line final root after mixed retry formats", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "```openui",
        'root = Card([old])',
        'old = TextContent("fenced stale")',
        "```",
        'root = Card([stale])',
        'stale = TextContent("unfenced stale")',
      ].join("\n"),
    );
    output.push("ro");
    output.push(
      'ot = Card([answer])\nanswer = TextContent("actual final answer")',
    );

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("actual final answer")',
    );
  });

  it("does not treat a fence marker inside a component string as Markdown", () => {
    const output = new OpenUIOutputAccumulator();
    const source = [
      "root = Card([answer])",
      'answer = TextContent("',
      "```openui",
      'root = Card([fake])',
      "```",
      '")',
    ].join("\n");
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("falls back to the newest renderable candidate when a later root is invalid", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Card([answer])\nanswer = TextContent("keep me")';
    output.push(valid);
    output.push("root = Stack([])");

    expect(output.finish()).toBe(valid);
  });

  it("rejects a newer candidate with an unresolved component reference", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Card([answer])\nanswer = TextContent("keep me")';
    output.push(valid);
    output.push("root = Card([missing])");

    expect(output.finish()).toBe(valid);
  });

  it("rejects a newer candidate containing an unknown component", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Card([answer])\nanswer = TextContent("keep me")';
    output.push(valid);
    output.push("root = Card([bad])\nbad = MadeUp(\"nope\")");

    expect(output.finish()).toBe(valid);
  });

  it("does not mistake a chunk starting with root text inside a string for a new answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('root = Card([answer])\nanswer = TextContent("The ');
    output.push('root = token stays inside this string")');

    expect(output.finish()).toBe(
      'root = Card([answer])\nanswer = TextContent("The root = token stays inside this string")',
    );
  });

  it("wraps prose-only output in a valid OpenUI fallback", () => {
    const output = new OpenUIOutputAccumulator();
    output.push("A plain-text answer that would previously trigger parse-failed.");

    const result = output.finish();
    expect(result).toContain("Response rendered safely");
    expect(isRenderableOpenUI(result)).toBe(true);
  });

  it("produces valid status cards for early route responses", () => {
    expect(
      isRenderableOpenUI(createOpenUIStatus("warning", "No message", "Nothing to send.")),
    ).toBe(true);
  });

  it("chunks without changing the validated program", () => {
    const source = `root = Card([answer])\nanswer = TextContent(${JSON.stringify("smooth ".repeat(300))})`;
    const chunks = chunkOpenUIOutput(source);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThanOrEqual(72);
    expect(chunks.join("")).toBe(source);
  });

  it("discards buffered output when the turn fails", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume(
      agentMessage('root = Card([answer])\nanswer = TextContent("must not persist")'),
    );

    expect(emittedText(bridge.fail("Upstream failed."))).toBe("");
    expect(bridge.finish()).toEqual([]);
  });

  it("marks an unfinished tool as failed instead of inventing success", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume({
      sessionUpdate: "tool_call",
      toolCallId: "unfinished",
      title: "Pending tool",
      kind: "execute",
      status: "pending",
      rawInput: { command: "pwd" },
    });

    const result = bridge
      .finish()
      .find(
        (event) =>
          event.type === EventType.TOOL_CALL_RESULT &&
          "toolCallId" in event &&
          event.toolCallId === "unfinished",
      ) as (AGUIEvent & { isError?: boolean }) | undefined;
    expect(result?.isError).toBe(true);
  });
});
