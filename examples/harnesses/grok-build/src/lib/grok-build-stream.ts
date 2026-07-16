import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { GrokBuildSessionUpdate } from "./grok-build-acp";
import { chunkOpenUIOutput, OpenUIOutputAccumulator } from "./openui-output";

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return JSON.stringify({ value: String(value) });
  }
}

function jsonStringFragment(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function resultText(value: unknown, failed: boolean): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return failed ? "Tool call failed." : "";
  return safeJson(value);
}

function contentText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const record = content as { type?: unknown; text?: unknown };
  return record.type === "text" && typeof record.text === "string" ? record.text : "";
}

/** Maps Grok Build's ACP session updates into the AG-UI stream OpenUI consumes. */
export class GrokBuildAGUIBridge {
  private readonly assistantMessageId = crypto.randomUUID();
  private readonly endedTools = new Set<string>();
  private readonly resultedTools = new Set<string>();
  private readonly sentToolArgs = new Set<string>();
  private readonly startedTools = new Map<string, string>();
  private readonly output = new OpenUIOutputAccumulator();
  private messageEnded = false;
  private messageStarted = false;
  private thinkingId: string | undefined;

  private startMessage(): AGUIEvent[] {
    if (this.messageStarted) return [];
    this.messageStarted = true;
    return [
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: this.assistantMessageId,
        role: "assistant",
      } as AGUIEvent,
    ];
  }

  private startThinking(): AGUIEvent[] {
    if (this.thinkingId) return [];
    this.thinkingId = crypto.randomUUID();
    return [
      ...this.startMessage(),
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: this.thinkingId,
        toolCallName: "Thinking",
        parentMessageId: this.assistantMessageId,
      } as AGUIEvent,
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: this.thinkingId,
        delta: '{"_request":"',
      } as AGUIEvent,
    ];
  }

  private endThinking(error?: string): AGUIEvent[] {
    const toolCallId = this.thinkingId;
    if (!toolCallId) return [];
    this.thinkingId = undefined;
    const failed = Boolean(error);
    const content = error ?? "Reasoning complete.";
    return [
      { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: '"}' } as AGUIEvent,
      { type: EventType.TOOL_CALL_END, toolCallId } as AGUIEvent,
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: crypto.randomUUID(),
        toolCallId,
        content,
        role: "tool",
        ...(failed ? { isError: true, error: content } : {}),
      } as AGUIEvent,
    ];
  }

  private startTool(toolCallId: string, title: string): AGUIEvent[] {
    const events = this.endThinking();
    if (this.startedTools.has(toolCallId)) return events;
    this.startedTools.set(toolCallId, title);
    return [
      ...events,
      ...this.startMessage(),
      {
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: title,
        parentMessageId: this.assistantMessageId,
      } as AGUIEvent,
    ];
  }

  private toolArgs(toolCallId: string, value: unknown): AGUIEvent[] {
    if (value === undefined || this.sentToolArgs.has(toolCallId)) return [];
    this.sentToolArgs.add(toolCallId);
    const delta = safeJson(value);
    if (delta === "{}") return [];
    return [{ type: EventType.TOOL_CALL_ARGS, toolCallId, delta } as AGUIEvent];
  }

  private endTool(toolCallId: string): AGUIEvent[] {
    if (!this.startedTools.has(toolCallId) || this.endedTools.has(toolCallId)) return [];
    this.endedTools.add(toolCallId);
    return [{ type: EventType.TOOL_CALL_END, toolCallId } as AGUIEvent];
  }

  private toolResult(
    toolCallId: string,
    status: "completed" | "failed",
    value: unknown,
  ): AGUIEvent[] {
    if (!this.startedTools.has(toolCallId) || this.resultedTools.has(toolCallId)) return [];
    this.resultedTools.add(toolCallId);
    const failed = status === "failed";
    const content = resultText(value, failed);
    return [
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: crypto.randomUUID(),
        toolCallId,
        content,
        role: "tool",
        ...(failed ? { isError: true, error: content } : {}),
      } as AGUIEvent,
    ];
  }

  consume(update: GrokBuildSessionUpdate): AGUIEvent[] {
    switch (update.sessionUpdate) {
      case "agent_message_chunk": {
        const delta = contentText(update.content);
        if (!delta) return [];
        this.output.push(delta);
        return [];
      }

      case "agent_thought_chunk": {
        const delta = contentText(update.content);
        if (!delta) return [];
        const started = this.startThinking();
        const toolCallId = this.thinkingId;
        if (!toolCallId) return started;
        return [
          ...started,
          {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId,
            delta: jsonStringFragment(delta),
          } as AGUIEvent,
        ];
      }

      case "tool_call": {
        const title = update.title || update.kind || "Tool";
        const terminal = update.status === "completed" || update.status === "failed";
        const argsClosed = update.status === "in_progress" || terminal;
        const output = update.rawOutput !== undefined ? update.rawOutput : update.content;
        const terminalStatus = update.status === "failed" ? "failed" : "completed";
        return [
          ...this.startTool(update.toolCallId, title),
          ...this.toolArgs(update.toolCallId, update.rawInput),
          ...(argsClosed ? this.endTool(update.toolCallId) : []),
          ...(terminal ? this.toolResult(update.toolCallId, terminalStatus, output) : []),
        ];
      }

      case "tool_call_update": {
        const title = update.title || this.startedTools.get(update.toolCallId) || "Tool";
        const terminal = update.status === "completed" || update.status === "failed";
        const argsClosed = update.status === "in_progress" || terminal;
        const output = update.rawOutput !== undefined ? update.rawOutput : update.content;
        const terminalStatus = update.status === "failed" ? "failed" : "completed";
        return [
          ...this.startTool(update.toolCallId, title),
          ...this.toolArgs(update.toolCallId, update.rawInput),
          ...(argsClosed ? this.endTool(update.toolCallId) : []),
          ...(terminal ? this.toolResult(update.toolCallId, terminalStatus, output) : []),
        ];
      }

      case "retry_state": {
        if (update.type === "retrying") this.output.retry();
        return [];
      }

      case "turn_completed":
        return [];

      default:
        return [];
    }
  }

  finish(): AGUIEvent[] {
    if (this.messageEnded) return [];
    this.messageEnded = true;

    const events = this.endThinking();
    for (const toolCallId of this.startedTools.keys()) {
      events.push(...this.endTool(toolCallId));
      events.push(
        ...this.toolResult(
          toolCallId,
          "failed",
          "Tool call ended without a terminal result.",
        ),
      );
    }
    const output = this.output.finish();
    if (output) {
      events.push(...this.startMessage());
      for (const delta of chunkOpenUIOutput(output)) {
        events.push({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: this.assistantMessageId,
          delta,
        } as AGUIEvent);
      }
    }
    if (this.messageStarted) {
      events.push({
        type: EventType.TEXT_MESSAGE_END,
        messageId: this.assistantMessageId,
      } as AGUIEvent);
    }
    return events;
  }

  fail(message: string): AGUIEvent[] {
    if (this.messageEnded) return [];
    this.messageEnded = true;
    this.output.retry();

    const events = this.endThinking(message);
    for (const toolCallId of this.startedTools.keys()) {
      events.push(...this.endTool(toolCallId));
      events.push(...this.toolResult(toolCallId, "failed", message));
    }
    if (this.messageStarted) {
      events.push({
        type: EventType.TEXT_MESSAGE_END,
        messageId: this.assistantMessageId,
      } as AGUIEvent);
    }
    return events;
  }
}
