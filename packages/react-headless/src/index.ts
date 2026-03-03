export { ChatProvider } from "./v2/ChatProvider";
export { useThread, useThreadList } from "./v2/hooks";

export { MessageContext, MessageProvider, useMessage } from "./hooks/useMessage";
export { processStreamedMessage } from "./stream/processStreamedMessage";
export {
  agUIAdapter,
  openAIAdapter,
  openAIConversationMessageFormat,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
} from "./stream/adapters";

export type {
  ChatStore,
  ChatProviderProps,
  Thread,
  CreateMessage,
  ThreadState,
  ThreadActions,
  ThreadListState,
  ThreadListActions,
} from "./v2/types";

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
} from "./types/message";

export type { MessageFormat } from "./types/messageFormat";
export { identityMessageFormat } from "./types/messageFormat";
export type { StreamProtocolAdapter, AGUIEvent } from "./types/stream";
export { EventType } from "./types/stream";
