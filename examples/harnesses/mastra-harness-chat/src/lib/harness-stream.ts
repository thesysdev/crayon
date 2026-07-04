import type { HarnessEvent, HarnessMessage, HarnessMessageContent } from "@mastra/core/harness";
import type { AGUIEvent } from "@openuidev/react-headless";

const AGUI = {
  RUN_ERROR: "RUN_ERROR",
  TEXT_MESSAGE_CONTENT: "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END: "TEXT_MESSAGE_END",
  TEXT_MESSAGE_START: "TEXT_MESSAGE_START",
  TOOL_CALL_ARGS: "TOOL_CALL_ARGS",
  TOOL_CALL_END: "TOOL_CALL_END",
  TOOL_CALL_START: "TOOL_CALL_START",
} as const;

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return String(value);
  }
}

function messageText(message: HarnessMessage): string {
  return message.content
    .map((part: HarnessMessageContent) => (part.type === "text" ? part.text : ""))
    .join("");
}

export class HarnessAGUIBridge {
  private readonly assistantMessageId = crypto.randomUUID();
  private readonly textByMessageId = new Map<string, string>();
  private readonly startedToolCalls = new Map<string, string>();
  private readonly endedToolCalls = new Set<string>();
  private readonly streamedToolArgs = new Set<string>();
  private messageStarted = false;
  private messageEnded = false;

  private startMessage(): AGUIEvent[] {
    if (this.messageStarted) return [];
    this.messageStarted = true;
    return [
      {
        type: AGUI.TEXT_MESSAGE_START,
        messageId: this.assistantMessageId,
        role: "assistant",
      } as AGUIEvent,
    ];
  }

  private textDelta(message: HarnessMessage): AGUIEvent[] {
    if (message.role !== "assistant") return [];

    const next = messageText(message);
    const previous = this.textByMessageId.get(message.id) ?? "";
    if (next === previous) return [];

    this.textByMessageId.set(message.id, next);
    const delta = next.startsWith(previous) ? next.slice(previous.length) : next;
    if (!delta) return [];

    return [
      ...this.startMessage(),
      {
        type: AGUI.TEXT_MESSAGE_CONTENT,
        messageId: this.assistantMessageId,
        delta,
      } as AGUIEvent,
    ];
  }

  private startTool(toolCallId: string, toolName: string): AGUIEvent[] {
    if (this.startedToolCalls.has(toolCallId)) return [];
    this.startedToolCalls.set(toolCallId, toolName);
    return [
      ...this.startMessage(),
      {
        type: AGUI.TOOL_CALL_START,
        toolCallId,
        toolCallName: toolName,
        parentMessageId: this.assistantMessageId,
      } as AGUIEvent,
    ];
  }

  private endTool(toolCallId: string): AGUIEvent[] {
    if (!this.startedToolCalls.has(toolCallId) || this.endedToolCalls.has(toolCallId)) return [];
    this.endedToolCalls.add(toolCallId);
    return [
      {
        type: AGUI.TOOL_CALL_END,
        toolCallId,
      } as AGUIEvent,
    ];
  }

  consume(event: HarnessEvent): AGUIEvent[] {
    switch (event.type) {
      case "message_update":
      case "message_end":
        return this.textDelta(event.message);

      case "tool_input_start":
        return this.startTool(event.toolCallId, event.toolName);

      case "tool_input_delta":
        this.streamedToolArgs.add(event.toolCallId);
        return [
          ...this.startTool(
            event.toolCallId,
            event.toolName ?? this.startedToolCalls.get(event.toolCallId) ?? "Tool",
          ),
          {
            type: AGUI.TOOL_CALL_ARGS,
            toolCallId: event.toolCallId,
            delta: event.argsTextDelta,
          } as AGUIEvent,
        ];

      case "tool_start": {
        const args = safeJson(event.args);
        const alreadyStreamedArgs = this.streamedToolArgs.has(event.toolCallId);
        return [
          ...this.startTool(event.toolCallId, event.toolName),
          ...(args && args !== "{}" && !alreadyStreamedArgs
            ? [
                {
                  type: AGUI.TOOL_CALL_ARGS,
                  toolCallId: event.toolCallId,
                  delta: args,
                } as AGUIEvent,
              ]
            : []),
        ];
      }

      case "tool_approval_required":
        return [
          ...this.startTool(event.toolCallId, `${event.toolName} approval`),
          {
            type: AGUI.TOOL_CALL_ARGS,
            toolCallId: event.toolCallId,
            delta: safeJson(event.args),
          } as AGUIEvent,
          ...this.endTool(event.toolCallId),
        ];

      case "tool_suspended":
        return [
          ...this.startTool(event.toolCallId, `${event.toolName} suspended`),
          {
            type: AGUI.TOOL_CALL_ARGS,
            toolCallId: event.toolCallId,
            delta: safeJson(event.suspendPayload),
          } as AGUIEvent,
          ...this.endTool(event.toolCallId),
        ];

      case "tool_end":
      case "tool_input_end":
        return this.endTool(event.toolCallId);

      case "error":
        return [
          {
            type: AGUI.RUN_ERROR,
            message: event.error.message,
          } as AGUIEvent,
        ];

      default:
        return [];
    }
  }

  finish(): AGUIEvent[] {
    if (!this.messageStarted || this.messageEnded) return [];
    this.messageEnded = true;
    return [
      {
        type: AGUI.TEXT_MESSAGE_END,
        messageId: this.assistantMessageId,
      } as AGUIEvent,
    ];
  }
}
