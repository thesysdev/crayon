import type { AssistantMessage, Message, ToolCall, ToolMessage } from "../types";

/**
 * Real per-call lifecycle of a tool invocation.
 *
 * Derived from AG-UI stream events (never faked from `!!content`):
 *  - `streaming` — arguments are still arriving (`TOOL_CALL_ARGS` deltas).
 *  - `executing` — arguments closed (`TOOL_CALL_END` seen), awaiting a result.
 *  - `complete`  — a `TOOL_CALL_RESULT` landed without an error.
 *  - `error`     — a `TOOL_CALL_RESULT`/`RUN_ERROR` carried a failure.
 *
 * @category Types
 */
export type ToolCallStatus = "streaming" | "executing" | "complete" | "error";

/**
 * Single source of truth for one tool call + its (optional) result, used by the
 * UI layer instead of reading raw `ToolCall`/`ToolMessage` separately.
 *
 * Discriminated by `status` so impossible states are unrepresentable: the view
 * literally cannot read `result`/`errorText` in a state where they don't exist,
 * nor render an error as a success.
 *
 *  - `streaming` → args still arriving; `input` is `Partial<T>`, no result.
 *  - `executing` → args closed; `input` is `T`, awaiting result.
 *  - `complete`  → result landed OK; `input` is `T`, `result` is a string.
 *  - `error`     → result landed with a failure; `errorText` present.
 *
 * `input` is {@link partialJSONParse}'d **once** by the selector — never a raw
 * string for the consumer to parse.
 *
 * @category Types
 */
export type ToolActivity<T = unknown> =
  | {
      status: "streaming";
      id: string;
      toolName: string;
      toolCall: ToolCall;
      toolMessage: null;
      input: Partial<T>;
      result?: undefined;
      isError: false;
      errorText?: undefined;
      statusMessage?: string;
    }
  | {
      status: "executing";
      id: string;
      toolName: string;
      toolCall: ToolCall;
      toolMessage: null;
      input: T;
      result?: undefined;
      isError: false;
      errorText?: undefined;
      statusMessage?: string;
    }
  | {
      status: "complete";
      id: string;
      toolName: string;
      toolCall: ToolCall;
      toolMessage: ToolMessage;
      input: T;
      result: string;
      isError: false;
      errorText?: undefined;
      statusMessage?: string;
    }
  | {
      status: "error";
      id: string;
      toolName: string;
      toolCall: ToolCall;
      toolMessage: ToolMessage;
      input: T;
      result: string;
      isError: true;
      errorText?: string;
      statusMessage?: string;
    };

const isDev = () => typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";

/**
 * Closes dangling brackets/quotes for a partial (mid-stream) JSON string so it
 * can be parsed for a best-effort snapshot. Conservative: only trims a trailing
 * object key that is provably awaiting a value (signalled by a trailing colon),
 * leaving complete array/values intact.
 */
function balanceOpenJSON(raw: string): string {
  const closers: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") closers.push("}");
    else if (ch === "[") closers.push("]");
    else if (ch === "}" || ch === "]") closers.pop();
  }

  let out = raw;
  if (inString) {
    // Mid-string: drop a dangling escape, then close the string literal.
    if (escaped) out = out.slice(0, -1);
    out += '"';
  }

  // Drop a dangling object key with no value yet (`… "key":`). The colon is the
  // reliable "awaiting value" signal — a trailing string WITHOUT a colon may be
  // a complete array element/value, so leave it. Then drop any exposed comma.
  out = out.replace(/(?:,\s*)?"(?:[^"\\]|\\.)*"\s*:\s*$/, "");
  out = out.replace(/,\s*$/, "");

  for (let i = closers.length - 1; i >= 0; i--) out += closers[i];
  return out;
}

/**
 * Tolerant single-pass JSON parse for streamed tool arguments. Tries a straight
 * parse, then a bracket-balanced parse for partial input. **Never throws** —
 * returns `{}` when nothing parseable can be recovered.
 *
 * @category Utilities
 */
export function partialJSONParse(raw: string): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to the balanced attempt */
  }
  try {
    return JSON.parse(balanceOpenJSON(raw));
  } catch {
    return {};
  }
}

let warnedTitle = false;

/**
 * Maps the deprecated `_title` tool-arg key onto a typed `statusMessage` for one
 * minor release (with a one-time dev warning). Prefer a renderer-owned typed
 * field going forward.
 */
function readStatusMessage(input: unknown): string | undefined {
  if (input && typeof input === "object" && "_title" in input) {
    const value = (input as Record<string, unknown>)["_title"];
    if (typeof value === "string") {
      if (isDev() && !warnedTitle) {
        warnedTitle = true;
        console.warn(
          "[OpenUI] The `_title` tool-arg key is deprecated and will be removed; " +
            "the renderer now exposes a typed `statusMessage` on ToolActivity instead.",
        );
      }
      return value;
    }
  }
  return undefined;
}

/**
 * Pairs every tool call on an assistant message with its result message **by
 * `toolCallId`** (id-keyed, no positional `break`), producing a typed
 * {@link ToolActivity} per call. Turn-safe even when tool messages trail or
 * interleave with other messages.
 *
 * @param message       The assistant message owning the tool calls.
 * @param allMessages   The full thread message list (scanned for tool results).
 * @param executingIds  Tool-call ids whose args have closed but whose result
 *                      hasn't landed (the store's `executingToolCallIds`).
 *
 * @category Utilities
 */
export function pairToolActivity(
  message: AssistantMessage,
  allMessages: ReadonlyArray<Message>,
  executingIds: ReadonlySet<string> = new Set(),
): ToolActivity[] {
  const byCallId = new Map<string, ToolMessage>();
  // Every tool-call id owned by ANY assistant message — used to detect orphan
  // tool results (a `role:"tool"` message whose call exists nowhere).
  const ownedCallIds = new Set<string>();
  for (const m of allMessages) {
    if (m.role === "tool") {
      const tm = m as ToolMessage;
      if (tm.toolCallId) byCallId.set(tm.toolCallId, tm);
    } else if (m.role === "assistant") {
      for (const tc of (m as AssistantMessage).toolCalls ?? []) ownedCallIds.add(tc.id);
    }
  }

  const activities = (message.toolCalls ?? []).map((toolCall): ToolActivity => {
    const toolMessage = byCallId.get(toolCall.id) ?? null;
    const input = partialJSONParse(toolCall.function.arguments) as Record<string, unknown>;
    const statusMessage = readStatusMessage(input);
    const base = {
      id: toolCall.id,
      toolName: toolCall.function.name,
      toolCall,
      statusMessage,
    };

    if (toolMessage) {
      return toolMessage.error
        ? {
            ...base,
            status: "error",
            toolMessage,
            input: input as never,
            result: toolMessage.content,
            isError: true,
            errorText: toolMessage.error,
          }
        : {
            ...base,
            status: "complete",
            toolMessage,
            input: input as never,
            result: toolMessage.content,
            isError: false,
          };
    }

    return executingIds.has(toolCall.id)
      ? {
          ...base,
          status: "executing",
          toolMessage: null,
          input: input as never,
          isError: false,
        }
      : {
          ...base,
          status: "streaming",
          toolMessage: null,
          input: input as Partial<unknown>,
          isError: false,
        };
  });

  // Orphan tool results: tool messages that trail THIS assistant message but
  // belong to no tool call anywhere. Previously these still rendered (as a
  // generic result chip); pairing by id alone would drop them. Attribute each
  // to the assistant message it positionally trails so it renders exactly once.
  const msgIndex = allMessages.findIndex((m) => m.id === message.id);
  if (msgIndex !== -1) {
    for (let i = msgIndex + 1; i < allMessages.length; i++) {
      const m = allMessages[i];
      if (!m || m.role !== "tool") break;
      const tm = m as ToolMessage;
      if (!tm.toolCallId || ownedCallIds.has(tm.toolCallId)) continue;
      const orphanCall: ToolCall = {
        id: tm.toolCallId,
        type: "function",
        function: { name: "", arguments: "" },
      };
      // Key by the (unique) tool-message id, not the toolCallId — two orphan
      // results can share a toolCallId in persisted history and would otherwise
      // collide on the React key.
      const base = { id: tm.id, toolName: "", toolCall: orphanCall };
      activities.push(
        tm.error
          ? {
              ...base,
              status: "error",
              toolMessage: tm,
              input: {} as never,
              result: tm.content,
              isError: true,
              errorText: tm.error,
            }
          : {
              ...base,
              status: "complete",
              toolMessage: tm,
              input: {} as never,
              result: tm.content,
              isError: false,
            },
      );
    }
  }

  return activities;
}
