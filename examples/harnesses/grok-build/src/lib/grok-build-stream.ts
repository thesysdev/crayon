import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { GrokBuildSessionUpdate } from "./grok-build-acp";
import { chunkOpenUIOutput, OpenUIOutputAccumulator } from "./openui-output";

type ToolUpdate = Extract<
  GrokBuildSessionUpdate,
  { sessionUpdate: "tool_call" | "tool_call_update" }
>;

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
  private readonly toolOutputs = new Map<string, unknown>();
  private readonly toolStatuses = new Map<string, ToolUpdate["status"]>();
  private readonly output = new OpenUIOutputAccumulator();
  private messageEnded = false;
  private messageStarted = false;
  private terminalError: string | undefined;
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

  private endThinking(content = "Reasoning complete.", failed = false): AGUIEvent[] {
    const toolCallId = this.thinkingId;
    if (!toolCallId) return [];
    this.thinkingId = undefined;
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

  private closePendingTools(message: string): AGUIEvent[] {
    const events: AGUIEvent[] = [];
    for (const toolCallId of this.startedTools.keys()) {
      if (this.resultedTools.has(toolCallId)) continue;
      events.push(...this.endTool(toolCallId));
      events.push(...this.toolResult(toolCallId, "failed", message));
    }
    return events;
  }

  private consumeToolUpdate(update: ToolUpdate): AGUIEvent[] {
    const { toolCallId } = update;
    const title = update.title || this.startedTools.get(toolCallId) || update.kind || "Tool";
    const events = this.startTool(toolCallId, title);

    if (update.status) this.toolStatuses.set(toolCallId, update.status);
    if (Object.prototype.hasOwnProperty.call(update, "rawOutput")) {
      this.toolOutputs.set(toolCallId, update.rawOutput);
    } else if (Object.prototype.hasOwnProperty.call(update, "content")) {
      this.toolOutputs.set(toolCallId, update.content);
    }

    events.push(...this.toolArgs(toolCallId, update.rawInput));

    const status = this.toolStatuses.get(toolCallId);
    const terminal = status === "completed" || status === "failed";
    if (terminal || (status === "in_progress" && this.sentToolArgs.has(toolCallId))) {
      events.push(...this.endTool(toolCallId));
    }
    if (terminal) {
      events.push(
        ...this.toolResult(
          toolCallId,
          status,
          this.toolOutputs.has(toolCallId) ? this.toolOutputs.get(toolCallId) : undefined,
        ),
      );
    }

    return events;
  }

  private emitOutput(output: string): AGUIEvent[] {
    if (!output) return [];
    const events = this.startMessage();
    for (const delta of chunkOpenUIOutput(output)) {
      events.push({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: this.assistantMessageId,
        delta,
      } as AGUIEvent);
    }
    return events;
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

      case "tool_call":
      case "tool_call_update":
        return this.consumeToolUpdate(update);

      case "retry_state": {
        if (update.type === "retrying") {
          this.output.retry();
          const attempt = update.attempt ? ` ${update.attempt}` : "";
          const maximum = update.max_retries ? ` of ${update.max_retries}` : "";
          const message = `Model attempt${attempt}${maximum} was retried.`;
          return [
            ...this.endThinking(message),
            ...this.closePendingTools("Tool call was superseded by a model retry."),
          ];
        }
        if (update.type === "failed") {
          const message = update.message || update.reason || "Grok Build retries failed.";
          this.terminalError = message;
          return [
            ...this.endThinking(message, true),
            ...this.closePendingTools(message),
          ];
        }
        return [];
      }

      case "turn_completed": {
        if (update.stop_reason === "error") {
          const message =
            update.agent_result || this.terminalError || "Grok Build completed with an error.";
          this.terminalError = message;
          return [
            ...this.endThinking(message, true),
            ...this.closePendingTools(message),
          ];
        }
        return [];
      }

      default:
        return [];
    }
  }

  needsCorrection(): boolean {
    return this.output.needsCorrection();
  }

  correctionPrompt(): string {
    return this.output.correctionPrompt();
  }

  beginCorrection(): AGUIEvent[] {
    const events = this.endThinking("Final UI validation failed; correcting the response.");
    this.output.resetForCorrection();
    return events;
  }

  finish(): AGUIEvent[] {
    if (this.messageEnded) return [];
    this.messageEnded = true;

    const events = this.endThinking();
    events.push(...this.closePendingTools("Tool call ended without a terminal result."));
    const output = this.output.finish();
    events.push(...this.emitOutput(output));
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
    const failure = this.terminalError ?? message;

    const events = this.endThinking(failure, true);
    events.push(...this.closePendingTools(failure));
    if (this.output.hasOutput()) events.push(...this.emitOutput(this.output.finish()));
    if (this.messageStarted) {
      events.push({
        type: EventType.TEXT_MESSAGE_END,
        messageId: this.assistantMessageId,
      } as AGUIEvent);
    }
    return events;
  }
}
