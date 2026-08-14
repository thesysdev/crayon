import {
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { OPENUI_PROMPT_TOOL_NAME } from "./constants";

export interface CreateShouldContinueAfterOpenUIPromptOptions {
  promptToolName?: string;
}

export interface OpenUIContinuationMessage {
  role: string;
  parts: Array<{
    type: string;
    state?: string;
  }>;
}

export type OpenUIContinuationPredicate = (options: {
  messages: OpenUIContinuationMessage[];
}) => boolean;

export function createShouldContinueAfterOpenUIPrompt({
  promptToolName = OPENUI_PROMPT_TOOL_NAME,
}: CreateShouldContinueAfterOpenUIPromptOptions = {}): OpenUIContinuationPredicate {
  if (promptToolName.length === 0) {
    throw new Error("The OpenUI prompt tool name must not be empty.");
  }

  return ({ messages }) => {
    const aiMessages = messages as UIMessage[];
    if (!lastAssistantMessageIsCompleteWithToolCalls({ messages: aiMessages })) {
      return false;
    }

    const message = aiMessages.at(-1);
    if (!message || message.role !== "assistant") {
      return false;
    }

    const lastStepStartIndex = message.parts.reduce(
      (lastIndex, part, index) => (part.type === "step-start" ? index : lastIndex),
      -1,
    );
    const toolParts = message.parts.slice(lastStepStartIndex + 1).filter(isToolUIPart);

    return (
      toolParts.every((part) => part.state === "output-available") &&
      toolParts.some((part) => getToolName(part) === promptToolName)
    );
  };
}

export const shouldContinueAfterOpenUIPrompt = createShouldContinueAfterOpenUIPrompt();
