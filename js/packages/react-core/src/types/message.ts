export type {
  ActivityMessage,
  AssistantMessage,
  BinaryInputContent,
  DeveloperMessage,
  FunctionCall,
  InputContent,
  Message,
  ReasoningMessage,
  SystemMessage,
  TextInputContent,
  ToolCall,
  ToolMessage,
  UserMessage,
} from "@ag-ui/core";

import type { UserMessage } from "@ag-ui/core";
export type CreateMessage = Omit<UserMessage, "id">;
