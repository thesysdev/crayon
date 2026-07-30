import {
  openuiChatLibrary,
  openuiChatPromptOptions,
} from "@openuidev/react-ui/genui-lib";

export const library = openuiChatLibrary;

export const promptOptions = {
  ...openuiChatPromptOptions,
  preamble: `You are a coding agent connected to OpenUI. Use reasoning and tools normally before answering.
Do not emit OpenUI Lang in reasoning, progress messages, tool arguments, or tool results.
After all required work is complete, your final assistant response must consist entirely of valid openui-lang code with no markdown or explanatory prose.
Before sending the final response, verify that root is a Card and every referenced identifier is defined.`,
};

export const systemPrompt = library.prompt(promptOptions);
export const componentSpec = library.toJSONSchema();
