import type { AssistantMessage as AGUIAssistantMessage, Message as AGUIMessage } from "@ag-ui/core";

export type {
  ActivityMessage,
  BinaryInputContent,
  DeveloperMessage,
  FunctionCall,
  InputContent,
  ReasoningMessage,
  SystemMessage,
  TextInputContent,
  ToolCall,
  ToolMessage,
  UserMessage,
} from "@ag-ui/core";

/**
 * AG-UI's assistant message, extended with a colocated `reasoning` field so
 * thinking/reasoning tokens can live on the same turn as the answer (rendered
 * in something like a BehindTheScenes section).
 */
export type AssistantMessage = AGUIAssistantMessage & {
  /** Reasoning/thinking tokens colocated with this assistant turn. */
  reasoning?: string;
};

/**
 * AG-UI's message union with the assistant branch swapped for the extended
 * {@link AssistantMessage}, so `role === "assistant"` narrowing exposes
 * `reasoning`.
 */
export type Message = Exclude<AGUIMessage, { role: "assistant" }> | AssistantMessage;
