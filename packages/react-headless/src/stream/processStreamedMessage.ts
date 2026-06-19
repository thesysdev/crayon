import { AssistantMessage, EventType, Message, StreamProtocolAdapter, ToolMessage } from "../types";
import { agUIAdapter } from "./adapters";

/**
 * @inline
 */
interface Parameters {
  response: Response;
  /** A function that creates a new message in the thread (assistant or tool). */
  createMessage: (message: Message) => void;
  /** A function that updates an existing message in the thread (matched by id). */
  updateMessage: (message: Message) => void;
  /** The adapter to use for parsing the stream */
  adapter?: StreamProtocolAdapter;
}

/**
 * @category Utilities
 */
export const processStreamedMessage = async ({
  response,
  createMessage,
  updateMessage,
  adapter = agUIAdapter(),
}: Parameters): Promise<AssistantMessage | void> => {
  let currentMessage: AssistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    toolCalls: [],
  };

  let isFirst = true;

  // Tool messages by toolCallId, so repeated TOOL_CALL_RESULTs for the same
  // call (e.g. streamed artifact_call.delta snapshots, each re-delivering the
  // growing program) UPDATE one message in place instead of duplicating it.
  const toolMessagesByCallId = new Map<string, ToolMessage>();

  let rafId: number | null = null;
  const debouncedUpdate = (msg: AssistantMessage) => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateMessage(msg);
      rafId = null;
    });
  };

  for await (const event of adapter.parse(response)) {
    switch (event.type) {
      // TEXT_MESSAGE_CHUNK and TEXT_MESSAGE_CONTENT are very similar events but TEXT_MESSAGE_CHUNK
      // optionally allows for a role change. Since we don't support role changes in processMessage
      // right now, we treat both the same.
      case EventType.TEXT_MESSAGE_CHUNK:
      case EventType.TEXT_MESSAGE_CONTENT:
        currentMessage = {
          ...currentMessage,
          content: (currentMessage.content || "") + event.delta,
        };
        break;

      case EventType.TOOL_CALL_START:
        currentMessage = {
          ...currentMessage,
          toolCalls: [
            ...(currentMessage.toolCalls || []),
            {
              id: event.toolCallId,
              type: "function",
              function: {
                name: event.toolCallName,
                arguments: "",
              },
            },
          ],
        };
        break;

      case EventType.TOOL_CALL_ARGS:
        if (currentMessage.toolCalls) {
          const toolCalls = [...currentMessage.toolCalls];
          const toolCallIndex = toolCalls.findIndex((tc) => tc.id === event.toolCallId);
          if (toolCallIndex !== -1) {
            const currentToolCall = toolCalls[toolCallIndex];
            if (currentToolCall) {
              toolCalls[toolCallIndex] = {
                id: currentToolCall.id,
                type: "function",
                function: {
                  name: currentToolCall.function.name,
                  arguments: currentToolCall.function.arguments + event.delta,
                },
              };
              currentMessage = { ...currentMessage, toolCalls };
            }
          }
        }
        break;

      case EventType.TEXT_MESSAGE_START:
        // The optimistic id is kept regardless of `event.messageId` — swapping
        // ids mid-stream by deleting + re-creating the assistant message
        // breaks ordering when tool messages have already been appended
        // between the original create and this event (e.g. from
        // TOOL_CALL_RESULT). Persistence layers should map ids on save.
        break;

      case EventType.TOOL_CALL_RESULT: {
        // Upsert the tool message for this toolCallId. First result → create;
        // subsequent results for the same call (streamed artifact_call.delta
        // snapshots) → update the same message in place (no duplicates).
        const existing = toolMessagesByCallId.get(event.toolCallId);
        if (existing) {
          const updated: ToolMessage = { ...existing, content: event.content };
          toolMessagesByCallId.set(event.toolCallId, updated);
          updateMessage(updated);
        } else {
          const toolMessage: ToolMessage = {
            id: crypto.randomUUID(),
            role: "tool",
            toolCallId: event.toolCallId,
            content: event.content,
          };
          toolMessagesByCallId.set(event.toolCallId, toolMessage);
          createMessage(toolMessage);
        }
        continue; // skip the trailing isFirst/update logic — this event doesn't touch currentMessage
      }

      case EventType.RUN_ERROR: {
        const msg = (event as any).message || (event as any).error || "Stream error";
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    }

    if (isFirst) {
      createMessage(currentMessage);
      isFirst = false;
    } else {
      // debounce the message update using raf
      debouncedUpdate(currentMessage);
    }
  }

  if (rafId !== null) {
    // flush any update
    cancelAnimationFrame(rafId);
    updateMessage(currentMessage);
  }

  return currentMessage;
};
