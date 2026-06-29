import { useMemo } from "react";
import { pairToolActivity, type ToolActivity } from "../store/toolActivity";
import type { AssistantMessage, Message, ToolMessage } from "../types";
import { useThread } from "./useThread";

/**
 * Memoized view of an assistant message's tool calls paired with their results,
 * as a typed {@link ToolActivity} array.
 *
 * Wraps {@link pairToolActivity}, re-pairing only when something that affects
 * the result actually changes: an argument string grows, a tool result lands or
 * changes length/error, or the store's executing set changes. Keying on both
 * args length **and** result length matters — a result can arrive after args
 * are already closed, and vice versa.
 *
 * @category Hooks
 */
export function useToolActivities(
  message: AssistantMessage,
  allMessages: Message[],
): ToolActivity[] {
  const executingIds = useThread((s) => s.executingToolCallIds);

  const argsKey = (message.toolCalls ?? [])
    .map((t) => `${t.id}:${t.function.arguments.length}`)
    .join("|");

  const resultKey = allMessages
    .filter((m): m is ToolMessage => m.role === "tool")
    .map((m) => `${m.toolCallId}:${m.content?.length ?? 0}:${m.error ? 1 : 0}`)
    .join("|");

  return useMemo(
    () => pairToolActivity(message, allMessages, executingIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message.id, argsKey, resultKey, executingIds],
  );
}
