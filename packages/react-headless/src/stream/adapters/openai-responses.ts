import type {
  ResponseFunctionToolCallOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

export const openAIResponsesAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    // Map item_id → call_id so TOOL_CALL_ARGS can reference the correct toolCallId
    const itemIdToCallId: Record<string, string> = {};
    // Accumulate the streamed artifact program per call_id. The backend emits
    // the MERGED program progressively via `response.artifact_call.delta`; we
    // hold the running text so each delta can re-deliver a coherent carrier.
    const artifactProgramByCallId: Record<string, string> = {};

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      // Accumulate across reads: a single SSE `data:` line (e.g. a multi-KB
      // artifact function_call_output payload) can span several network
      // chunks. Splitting each chunk independently tears that line in two and
      // drops it on JSON.parse. Hold the trailing partial line until the next
      // read; on done, flush whatever remains.
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as { type?: string };

          // Backend extension: the `artifact_call` channel is not part of the
          // stock OpenAI ResponseStreamEvent union. Handle the program-delta
          // here, before the typed switch, so we can read its non-OpenAI shape
          // ({ item_id, call_id, delta }).
          if (parsed.type === "response.artifact_call.delta") {
            const e = parsed as {
              item_id?: string;
              call_id?: string;
              delta?: string;
            };
            const callId = e.call_id ?? (e.item_id ? itemIdToCallId[e.item_id] : undefined);
            if (callId && typeof e.delta === "string") {
              // The backend streams the MERGED program progressively (generate
              // or edit alike) — accumulate it and re-deliver the carrier on
              // each delta. The client never merges ops; it always sees a
              // coherent growing program. content = the accumulated program text.
              artifactProgramByCallId[callId] = (artifactProgramByCallId[callId] ?? "") + e.delta;
              yield {
                type: EventType.TOOL_CALL_RESULT,
                messageId: e.item_id ?? `artifact_call_${callId}`,
                toolCallId: callId,
                content: JSON.stringify({ content: artifactProgramByCallId[callId] }),
              };
            }
            continue;
          }

          const event = parsed as ResponseStreamEvent;

          switch (event.type) {
            case "response.output_item.added": {
              // OpenAI's Conversations API surfaces function_call_output as an
              // output item even though the SDK's ResponseOutputItem union does
              // not declare it. Widen the type so we can branch on it below.
              const item = event.item as typeof event.item | ResponseFunctionToolCallOutputItem;
              if (item.type === "message" && item.role === "assistant") {
                yield {
                  type: EventType.TEXT_MESSAGE_START,
                  messageId: item.id,
                  role: "assistant",
                };
              } else if (item.type === "function_call") {
                // Store the mapping so we can resolve it in arguments.delta
                itemIdToCallId[item.id ?? item.call_id] = item.call_id;
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId: item.call_id,
                  toolCallName: item.name,
                };
              } else if (item.type === "function_call_output") {
                // Fired when a function_call_output we submitted as input is
                // integrated into a conversation-linked response — surfaces
                // server-side tool execution to the SDK store.
                yield {
                  type: EventType.TOOL_CALL_RESULT,
                  messageId: item.id,
                  toolCallId: item.call_id,
                  content:
                    typeof item.output === "string"
                      ? item.output
                      : JSON.stringify(item.output),
                };
              }
              break;
            }

            case "response.output_text.delta":
              yield {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId: event.item_id,
                delta: event.delta,
              };
              break;

            case "response.output_text.done":
              yield {
                type: EventType.TEXT_MESSAGE_END,
                messageId: event.item_id,
              };
              break;

            case "response.function_call_arguments.delta": {
              const callId = itemIdToCallId[event.item_id] ?? event.item_id;
              yield {
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: callId,
                delta: event.delta,
              };
              break;
            }

            case "response.function_call_arguments.done": {
              const callId = itemIdToCallId[event.item_id] ?? event.item_id;
              yield {
                type: EventType.TOOL_CALL_END,
                toolCallId: callId,
              };
              break;
            }

            case "error":
              yield {
                type: EventType.RUN_ERROR,
                message: event.message,
                code: event.code ?? undefined,
              };
              break;

            case "response.failed":
              yield {
                type: EventType.RUN_ERROR,
                message: event.response?.error?.message ?? "Response failed",
                code: event.response?.error?.code ?? undefined,
              };
              break;

            // Intentionally unhandled — these are lifecycle/metadata events:
            // response.created, response.in_progress, response.completed,
            // response.content_part.added, response.content_part.done,
            // response.output_item.done, etc.
            default:
              break;
          }
        } catch (e) {
          console.error("Failed to parse OpenAI Responses SSE event", e);
        }
      }
      if (done) break;
    }
  },
});
