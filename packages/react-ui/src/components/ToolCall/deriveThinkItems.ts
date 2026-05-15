import type { ThinkItem, ToolCall, ToolMessage } from "@openuidev/react-headless";
import { ThinkItemType } from "@openuidev/react-headless";

/**
 * Derives ThinkItem[] from existing tool call data.
 * Tolerates partial JSON during streaming (never throws).
 * Callers should wrap in useMemo.
 */
export const deriveThinkItems = (
  toolCalls: ToolCall[],
  toolMessages: ToolMessage[],
): ThinkItem[] => {
  const tmMap = new Map<string, ToolMessage>();
  for (const tm of toolMessages) tmMap.set(tm.toolCallId, tm);

  return toolCalls.map((tc) => {
    const toolName = tc.function.name;
    const id = tc.id;
    const matched = tmMap.get(tc.id);

    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(tc.function.arguments);
    } catch {
      // partial JSON during streaming
    }

    if (parsed && parsed["_type"] === "WEB_SEARCH") {
      return {
        type: ThinkItemType.WEB_SEARCH,
        data: {
          id,
          searchQuery: (parsed["_query"] as string) ?? toolName,
          sources: Array.isArray(parsed["_sources"]) ? parsed["_sources"] : [],
          reasoning: parsed["_reasoning"] as string | undefined,
          isError: matched?.error ? "true" : undefined,
          errorMessage: matched?.error ? matched.content : undefined,
        },
      } satisfies ThinkItem;
    }

    let toolRequest: string | undefined;
    let toolResponse: string | undefined;
    let reasoning: string | undefined;
    let toolCallTitle: string | undefined;

    if (parsed) {
      const hasEnriched = parsed["_request"] != null || parsed["_response"] != null;
      if (hasEnriched) {
        toolRequest =
          parsed["_request"] != null ? JSON.stringify(parsed["_request"], null, 2) : undefined;
        toolResponse =
          parsed["_response"] != null ? JSON.stringify(parsed["_response"], null, 2) : undefined;
      } else {
        toolRequest = JSON.stringify(parsed, null, 2);
      }
      reasoning = parsed["_reasoning"] as string | undefined;
      toolCallTitle = parsed["_title"] as string | undefined;
    } else if (tc.function.arguments) {
      toolRequest = tc.function.arguments;
    }

    if (!toolResponse && matched) toolResponse = matched.content;

    return {
      type: ThinkItemType.TOOL_CALL,
      data: {
        id,
        toolName,
        toolCallTitle,
        toolRequest,
        toolResponse,
        reasoning,
        isError: matched?.error ? "true" : undefined,
      },
    } satisfies ThinkItem;
  });
};
